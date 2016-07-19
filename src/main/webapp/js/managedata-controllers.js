'use strict';

/* Controllers */

var oracleMigration = window.oracleMigration;
oracleMigration.controller('ManageDataController', ["$scope", '$http', 'adAlerts', '$window', '$confirm', 'ngDialog', '$location', '$q',
	function($scope, $http, adAlerts, $window, $confirm, ngDialog, $location, $q) {

		var $schemaSelect = $(".js-data-schema-ajax");
		$schemaSelect.on("select2:close", function(e) {
			$('.js-data-table-ajax').empty();
			$scope.schemaSelected = e.currentTarget.value;
			$scope.initFromTableLayer();
		});

		var $tableSelect = $(".js-data-table-ajax");
		$tableSelect.on("select2:close", function(e) {
			$scope.tableSelected = e.currentTarget.value;
			// init
			$scope.initFromColumnLayer();
			// fetch columns
			$scope.fetchColumnNameOptions($scope.schemaSelected, $scope.tableSelected);
		});

		var $selctColumnSelect = $(".js-data-selectcolumn-ajax");
		$selctColumnSelect.on("select2:select", function(e) {
			$scope.selectColumns.add(e.params.data.id);
		});

		$selctColumnSelect.on("select2:unselect", function(e) {
			$scope.selectColumns.delete(e.params.data.id);
		});

		$(".js-data-schema-ajax").select2({
			ajax: {
				url: "./schema",
				dataType: 'json',
				delay: 250,
				data: function(params) {
					return {
						sourceUsername: $scope.sourceUsername,
						sourcePassword: $scope.sourcePassword,
						sourceUrl: $scope.sourceUrl,
						key: params.term
					};
				},
				processResults: function(data, params) {
					params.page = params.page || 1;
					var items = dataToItems(data);
					return {
						results: items,
						pagination: {
							more: (params.page * 30) < data.total_count
						}
					};
				},
				cache: true
			},
			escapeMarkup: function(markup) {
				return markup;
			}, // let our custom formatter work
			minimumInputLength: 0
		});

		$(".js-data-table-ajax").select2({
			ajax: {
				url: "./table",
				dataType: 'json',
				delay: 250,
				data: function(params) {
					return {
						sourceUsername: $scope.sourceUsername,
						sourcePassword: $scope.sourcePassword,
						sourceUrl: $scope.sourceUrl,
						schema: $scope.schemaSelected,
						key: params.term
					};
				},
				processResults: function(data, params) {
					params.page = params.page || 1;
					var items = dataToItems(data);
					return {
						results: items,
						pagination: {
							more: (params.page * 30) < data.total_count
						}
					};
				},
				cache: true
			},
			escapeMarkup: function(markup) {
				return markup;
			}, // let our custom formatter work
			minimumInputLength: 0
		});

		var dataToItems = function(data) {
			var items = [];
			for (var i = 0; i < data.length; i++) {
				var item = {};
				var s = data[i];
				item.id = s;
				item.text = s;
				items.push(item);
			};
			return items;
		}

		$(".js-data-selectcolumn-ajax").select2({
			ajax: {
				url: "./column",
				dataType: 'json',
				delay: 250,
				data: function(params) {
					return {
						sourceUsername: $scope.sourceUsername,
						sourcePassword: $scope.sourcePassword,
						sourceUrl: $scope.sourceUrl,
						schema: $scope.schemaSelected,
						table: $scope.tableSelected
					};
				},
				processResults: function(data, params) {
					params.page = params.page || 1;
					var items = dataToItems(data);
					return {
						results: items,
						pagination: {
							more: (params.page * 30) < data.total_count
						}
					};
				},
				cache: true
			},
			escapeMarkup: function(markup) {
				return markup;
			}, // let our custom formatter work
			minimumInputLength: 0
		});

		$scope.tableSelected = undefined;
		$scope.schemaSelected = undefined;
		$scope.columnSelected = undefined;
		$scope.orderByColumnSelected = undefined;
		$scope.conditionOp1 = undefined;
		$scope.conditionValue1 = "";
		$scope.jsonResult = {};
		$scope.urlSelected = "{}";
		$scope.selectColumns = new Set();
		$scope.distinct = false;
		$scope.desc = false;
		$scope.expression1 = "";

		$scope.backToMigratePage = function() {
			$location.path("/");
		};

		$scope.columnNames = [];

		$scope.conditionOps = [];

		$scope.urls = [];

		$scope.$watch('urlSelected', function() {
			if ($scope.urlSelected == "{}") {
				return;
			}
			var obj = JSON.parse($scope.urlSelected);
			$scope.sourceUsername = obj.username;
			$scope.sourcePassword = obj.password;
			$scope.sourceUrl = obj.url;
			// fetch tables
			//$scope.fetchSchemaNameOptions($scope.urlSelected);
		});

		$scope.initFromTableLayer = function() {
			$scope.tableSelected = undefined;
			$scope.$apply(function() {
				$scope.initFromColumnLayer();
			});
		};

		$scope.initFromColumnLayer = function() {
			$scope.columnNames = [];
			$scope.columnSelected = undefined;
			$scope.orderByColumnSelected = undefined;
			$scope.conditionOp1 = undefined;
			$scope.conditionValue1 = "";
		};

		$scope.columnNameSelected = function(selected) {
			$scope.columnSelected = selected.columnName.name;
		};

		$scope.orderByColumnNameSelected = function(selected) {
			$scope.orderByColumnSelected = selected.columnName.name;
		};

		$scope.conditionOp1Selected = function(selected) {
			$scope.conditionOp1 = selected.conditionOp.name;
		};

		$scope.fetchColumnNameOptions = function(schema, tableName) {
			$http({
				method: 'GET',
				url: './column',
				params: {
					"sourceUsername": $scope.sourceUsername,
					"sourcePassword": $scope.sourcePassword,
					"sourceUrl": $scope.sourceUrl,
					"schema": schema,
					"table": tableName
				}
			}).then(function successCallback(response) {
				var data = response.data;
				angular.forEach(data, function(value, key) {
					var obj = {};
					obj.name = value;
					$scope.columnNames.push(obj);
				});
			}, function errorCallback(response) {});
		};

		$scope.fetchConditionOps = function() {
			$http({
				method: 'GET',
				url: '/springbased-1.0/columnOperator'
			}).then(function successCallback(response) {
				var data = response.data;
				angular.forEach(data, function(value, key) {
					var obj = {};
					obj.name = value;
					$scope.conditionOps.push(obj);
				});
			}, function errorCallback(response) {});
		};

		$scope.selectColumnsSetToString = function() {
			if ($scope.selectColumns.size == 0) {
				return "*";
			}
			var selectColumnSql = " ";
			for (let column of $scope.selectColumns) {
				selectColumnSql += column + ", ";
			}
			if ($scope.distinct) {
				return "distinct" + selectColumnSql.substring(0, selectColumnSql.length - 2);
			}
			return selectColumnSql.substring(0, selectColumnSql.length - 2);
		};

		var prepareOrderBySql = function() {
			var orderBySql = "";
			if (!($scope.orderByColumnSelected === undefined)) {
				// can only order by a selected column
				if ($scope.selectColumns.size > 0) {
					// add this column to selected in case it not exist
					$scope.selectColumns.add($scope.orderByColumnSelected);
				}
				orderBySql += $scope.orderByColumnSelected;
				if ($scope.desc) {
					orderBySql += " desc ";
				} else {
					orderBySql += " asc ";
				}
			}
			return orderBySql;
		};

		var prepareWhereSql = function() {
			var sql = "";
			if (!($scope.columnSelected === undefined) && $scope.expression1.length > 0) {
				sql += " where " + $scope.columnSelected + " " + $scope.expression1;
			}
			return sql;
		};

		$scope.query = function() {
			$http({
				method: 'GET',
				url: './tableDataInJson',
				params: {
					"sourceUsername": $scope.sourceUsername,
					"sourcePassword": $scope.sourcePassword,
					"sourceUrl": $scope.sourceUrl,
					"schema": $scope.schemaSelected,
					"table": $scope.tableSelected,
					"orderBy": prepareOrderBySql(),
					"selectColumns": $scope.selectColumnsSetToString(),
					"whereSql": prepareWhereSql()
				}
			}).then(function successCallback(response) {
				var data = response.data;
				$scope.jsonResult = data;
			}, function errorCallback(response) {});
		};

		$scope.getQuickSelectionOptions = function() {
			$http({
				method: 'GET',
				url: './connections'
			}).then(function successCallback(response) {
				angular.forEach(response.data, function(value, key) {
					var quickSelectOption = {};
					quickSelectOption.username = value.username;
					quickSelectOption.password = value.password;
					quickSelectOption.ip = value.url.replace('jdbc:oracle:thin:@', '').replace(/:1521:.*/, '');
					quickSelectOption.sid = value.url.replace(/jdbc:oracle:thin:@.*:1521:/, '');
					quickSelectOption.url = value.url;
					$scope.urls.push(quickSelectOption);
				});
			}, function errorCallback(response) {});
		};
		$scope.getQuickSelectionOptions();
		// fetch all table name options at first step
		$scope.fetchConditionOps();

	}
]);