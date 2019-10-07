//  given json file of assembly dependencies, reformat to match format
//  needed for treemap visualization
function formatAssemblyTree(json, size=100) {
    console.log(size);
    var request = new XMLHttpRequest();
    request.open("GET", json, false);
    request.send(null)

    var data = JSON.parse(request.responseText);
    var as_dict = {};
    data.forEach(function(as) {
        var as_name = as["name"];
        
        as_dict["name"] = as_name;
        as_dict["children"] = [];
        var classes = as["sections"];
        if (classes != null) {
            classes.forEach(function(cl) {
                var class_dict = {};
                var class_name = cl["name"];
                
                
                var methods = cl["sections"];
                if (methods != null) {
                    methods.forEach(function(method) {
                        if (parseInt(method["size"]) > size) {
                            if (class_dict["children"] == null) {
                                class_dict["children"] = [];
                                class_dict["name"] = class_name;
                            }
                            class_dict["children"].push({"name": method["name"], 
                                                    "value": method["size"]});
                        }
                        
                    })
                    if (class_dict["name"] != null) {
                        as_dict["children"].push(class_dict);
                    }
                    
                }
            })
            
        }
    })
    return as_dict;
}