function getMethodName(name, type="sunburst") {
    name = name.split("(")[0];
    if (type == "sunburst") {
        name = name.replace(" ", "\n");
        name = "Removed," + name; 
    }
    return name;
}

function getClassName(className) {
    var name = className.split(" ");
    if (name.includes("extends")) {
        if (name.includes("implements")) {
            name = name.slice(name.length-5, name.length);
        } else {
            name = name.slice(name.length-3, name.length);
        }
        
        className = name.join(" ");
    }
    return className;
}

//  given json file of assembly dependencies, reformat to match format
//  needed for treemap visualization
function filterJson(data, size=100, overload=true, type="tree") {
    var as_dict = {};
    if (type == "sunburst") {
        var csv_str = "";
    } 
    data.forEach(function(as) {
        var as_name = as["name"];
        as_dict["name"] = as_name;
        as_dict["children"] = [];
        var classes = as["sections"];
        if (classes != null) {
            classes.forEach(function(cl) {
                var class_dict = {};
                var class_name = getClassName(cl["name"]);
                var methods = cl["sections"];
                if (methods != null) {
                    var names = [];
                    var sizes = [];
                    methods.forEach(function(method) {
                        var methodName = method["name"];
                        if (overload) {
                            methodName = getMethodName(methodName, type=type);
                        }
                        var ix = names.indexOf(methodName);
                        if (ix != -1) {
                            sizes[ix] += +method["size"];
                        } else {
                            names.push(methodName);
                            sizes.push(+method["size"])
                        }
                    })
                    for (var i=0; i<names.length; i++) {
                        if (sizes[i] >= size) {
                            if (class_dict["children"] == null) {
                                class_dict["children"] = [];
                                class_dict["name"] = class_name;
                            } else if (type == "tree") {
                                class_dict["children"].push({"name": names[i], 
                                                        "value": sizes[i]});
                            }
                            else if (type == "flower") {
                                class_dict["children"].push({"name": names[i], 
                                                        "size": sizes[i]});
                            } else if (type == "sunburst") {
                                var name = names[i];
                                var line = as_name + "-" + class_name + "-" + name + "," + sizes[i] + "\n";
                                csv_str += line;
                            } 
                        }
                    }
               
                    if (class_dict["name"] != null) {
                        as_dict["children"].push(class_dict);
                    }
                    
                }
            })
            
        }
    })
    if (type == "sunburst") {
        return csv_str;
    }
    return as_dict;
}

function formatMethods(data, size=100, overload=true) {
    var data_list = [];
    data.forEach(function(as) {
        var asName = as["name"];
        if (as.sections != null) {
            as.sections.forEach(function(cl) {
                var className = cl["name"];
                var names = [];
                var sizes = [];
                cl.sections.forEach(function(method) {
                    var methodName = method["name"];
                    if (overload) {
                        methodName = getMethodName(methodName);
                    }
                    var ix = names.indexOf(methodName);
                    if (ix != -1) {
                        sizes[ix] += +method["size"];
                    } else {
                        names.push(methodName);
                        sizes.push(+method["size"])
                    }
                })

                for (var i=0; i<names.length; i++) {
                    if (sizes[i] >= size) {
                        data_list.push({"name": className + "\n" + names[i], 
                                        "value": sizes[i]});
                    }
                }
            })
        }
    })

    return data_list;
}

function formatClasses(data, size=100, overload=true) {
    var data_list = {};
    data.forEach(function(as) {
        var asName = as["name"];
        if (as.sections != null) {
            var class_list = [];
            as.sections.forEach(function(cl) {
                if (cl.size >= size){
                    class_list.push({"name": cl.name, "value": cl.size});
                }
                var names = [];
                var sizes = [];
                cl.sections.forEach(function(method) {
                    var methodName = method.name;
                    if (overload) {
                        methodName = getMethodName(methodName);
                    }
                    var ix = names.indexOf(methodName);
                    if (ix != -1) {
                        sizes[ix] += +method.size;
                    } else {
                        names.push(methodName);
                        sizes.push(+method.size);
                    }
                })
                var method_list = [];
                for (var i=0; i< names.length; i++) {
                    if (sizes[i] >= size) {
                        method_list.push({"name": names[i], "value": sizes[i]});
                    }
                }
                data_list[cl.name] = method_list;
            })
            data_list["class"] = class_list;
        }
    })
    
    return data_list;
}

function formatComparison(data_in, data_out, size=100, overload=true) {
    var data = {}
    data["linker_in"] = formatClasses(data_in);
    data["linker_out"] = formatClasses(data_out);
    return data;
}

function getLength(data, filtered) {
    var names = []
    filtered.forEach(item => {
        if (!names.includes(item.name) && item.size != 0) {
            names.push(item.name)
            item.dependencies.forEach(index => {
                var dep = data[index];
                if (!names.includes(dep.name) && dep.size != 0) {
                    names.push(dep.name);
                }
            })
        }
    })

    return names;
}

function makeMatrix(n) {
    var arr = [];
    for(let i = 0; i < n; i++) {
        arr.push(new Array(n).fill(0));
    }
    return arr;
}


