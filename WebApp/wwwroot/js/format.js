function getMethodName(name) {
    name = name.split("(")[0];

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
function filterJson(data, size=100, overload=true) {
    var treeDict = {"name" : "All", children : []}
    var csvStr = "";
    data.forEach(function(as) {
        var asDict = {};
        var asName = as["name"] + " (Assembly)";
        asDict["name"] = asName;
        asDict["children"] = [];
        var classes = as["children"];
        if (classes != null) {
            classes.forEach(function(cl) {
                var classDict = {};
                var className = getClassName(cl["name"]) + " (Class)";
                var methods = cl["children"];
                if (methods != null) {
                    var names = [];
                    var sizes = [];
                    methods.forEach(function(method) {
                        var methodName = method["name"];
                        if (overload) {
                            methodName = getMethodName(methodName) + " (Method)";
                        }
                        var ix = names.indexOf(methodName);
                        if (ix != -1) {
                            sizes[ix] += +method["size"];
                        } else {
                            names.push(methodName + " (Method)");
                            sizes.push(+method["size"])
                        }
                    })
                    for (var i=0; i<names.length; i++) {
                        if (sizes[i] >= size) {
                            if (classDict["children"] == null) {
                                classDict["children"] = [];
                                classDict["name"] = className;
                            } 
                            // Treemap format
                            classDict["children"].push({"name": names[i] , 
                                                    "value": sizes[i]});

                            // sunburst format
                            var name = names[i];
                            var line = asName + "-" + className + "-" + name + "," + sizes[i] + "\n";
                            csvStr += line;
                             
                        }
                    }
               
                    if (classDict["name"] != null) {
                        asDict["children"].push(classDict);
                    }
                    
                }
            })
            
        }
        treeDict.children.push(asDict)
    })

    return [treeDict, csvStr];
}

function formatMethods(data, size=100, overload=true) {
    var dataList = [];
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
                        dataList.push({"name": className + "\n" + names[i], 
                                        "value": sizes[i]});
                    }
                }
            })
        }
    })

    return dataList;
}

function formatClasses(data, size=100, overload=true) {
    var dataList = {};
    data.forEach(function(as) {
        var asName = as["name"];
        if (as.sections != null) {
            var classList = [];
            as.sections.forEach(function(cl) {
                if (cl.size >= size){
                    classList.push({"name": cl.name, "value": cl.size});
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
                var methodList = [];
                for (var i=0; i< names.length; i++) {
                    if (sizes[i] >= size) {
                        methodList.push({"name": names[i], "value": sizes[i]});
                    }
                }
                dataList[cl.name] = methodList;
            })
            dataList["class"] = classList;
        }
    })
    
    return dataList;
}

function formatComparison(dataIn, dataOut, size=100, overload=true) {
    var data = {}
    data["linker_in"] = formatClasses(dataIn);
    data["linker_out"] = formatClasses(dataOut);
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


