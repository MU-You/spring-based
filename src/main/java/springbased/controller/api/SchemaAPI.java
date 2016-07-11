package springbased.controller.api;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import springbased.bean.ConnectionInfo;
import springbased.service.ManageDataQueryService;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Created by I303152 on 7/1/2016.
 */
@RestController
public class SchemaAPI {

    private static final Logger log = Logger.getLogger(SchemaAPI.class);

    @Autowired
    private ManageDataQueryService queryService;

    @RequestMapping("/schema")
    public List<String> schemas(@RequestParam("sourceUsername") String sourceUsername,
                                @RequestParam("sourcePassword") String sourcePassword,
                                @RequestParam("sourceUrl") String sourceUrl,
                                @RequestParam(value = "key", defaultValue = "") String key) {
        List<String> schemas =  this.queryService.querySchemas(
                new ConnectionInfo(sourceUsername, sourcePassword, sourceUrl));
        return schemas.stream().filter(
                schema -> schema.toUpperCase().contains(key.toUpperCase())).collect(Collectors.toList());
    }
}
