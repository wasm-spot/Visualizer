function getMethodName(name) {
    name = name.split("(")[0];
    name = name.replace(" ", "\n");
    return name;
}

//  given json file of assembly dependencies, reformat to match format
//  needed for treemap visualization
function formatAssemblyTree(json) {
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
                class_dict["name"] = class_name;
                class_dict["children"] = []
                var methods = cl["sections"];
                if (methods != null) {
                    var names = [];
                    var sizes = [];
                    methods.forEach(function(method) {
                        var methodName = getMethodName(method["name"]);
                        var ix = names.indexOf(methodName);
                        if (ix != -1) {
                            sizes[ix] += +method["size"];
                        } else {
                            names.push(methodName);
                            sizes.push(+method["size"])
                        }
                    })
                    for (var i =0; i<names.length; i++) {
                        if (sizes[0] >= 75) {
                            class_dict["children"].push({"name": names[i], "value": sizes[i]});
                        }
                    }
                    as_dict["children"].push(class_dict);
                }
            })
            
        }
    })
    return as_dict;
}