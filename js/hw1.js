class StackedBarChartHorizontal {
    constructor (svg, caption, x, y, width, height, bar_width, deco) {
        this.svg = svg;
        [this.x, this.y] = [x, y];
        this.extentX = this.scaleX = this.scaleY = null;
        [this.width, this.height, this.bar_width] = [width, height, bar_width];
        this.deco = deco;
        this.dims = [];
        this.padding = 0.5;
        this.autoFit = true;

        this.g = this.svg.append("g");

        this.caption = this.g.append("text")
            .attr("class", "caption")
            .text(caption)
            .style("font-size", 15)
            .style("font-weight", "bold")
            .attr("text-anchor", "middle")
            .attr("transform", d => 
                `translate(${ [this.width / 2, 0] })`
            );

        this.legends = this.g.append("g")
            .attr("class", "legends")
            .attr("transform", d => 
                `translate(${ [this.x, this.y + 20] })`
            )

        this.graph = this.g.append("g")
            .attr("class", "graph")
            .attr("transform", d => 
                `translate(${ [this.x, this.y + 30] })`
            )
        this.axisX = this.graph.append("g")
            .attr("class", "axis")
            .attr("transform", d =>
                `translate(${ [0, 0] })`
            );
        this.axisY = this.graph.append("g")
            .attr("class", "axis")
            .attr("transform", d =>
                `translate(${ [0, 0] })`
            );
    }

    update(data, dims, keys, xlabel, color) {
        let legend = []
        keys.forEach(key => legend.push([key, color(key)]))

        this.caption.transition()
            .attr("transform", d => 
                `translate(${ [this.width / 2, 0] })`
            );

        this.graph.selectAll(".label")
            .data([part1.choice])
            .join("text")
            .attr("transform", `translate(${[this.width + 10, 2]})`)
            .classed("label", true)
            .text(xlabel);
        
        let legendSize = 12, legendPadding = 5, legendDist = 10;
        let legendAreaHeight = 50;
        // let legendAreaHeight = keys.length * (legendSize + legendPadding) + 20;
        
        this.legends.selectAll(".legend").remove();
        let gs = this.legends.selectAll(".legend")
            .data(legend)
            .join("g")
            .classed("legend", true);
        gs.append("rect")
            .attr("width", legendSize)
            .attr("height", legendSize)
            .style("fill", d => d[1]);
        gs.append("text")
            .text(d => d[0])
            .attr("transform", `translate(${[(legendSize + 5), legendSize - 2]})`);

        gs.attr("transform", (d, i, g) => {
            let sum = 0;
            for (let j = 0; j < i; j++)
                sum += g[j].getBBox().width + legendDist;
            return `translate(${[sum, 0]})`;
        });
        
        if (this.autoFit) {
            this.height = data.length * this.bar_width + 2 * this.bar_width * this.padding + (data.length - 1) * (10)    + legendAreaHeight;
        }

        this.graph.attr("transform", `translate(${[this.x, this.y + legendAreaHeight + 20]})`)

        this.dims = dims;
        this.extentX = d3.extent(data, d => {
            let sum = 0;
            keys.forEach(key => sum += d[key]);
            return sum;
        });
        this.scaleY = d3.scalePoint()
            .domain(this.dims)
            .range([0, this.height - legendAreaHeight])
            .padding(this.padding);
        this.scaleX = d3.scaleLinear()
            .domain([0, this.extentX[1]])
            .range([0, this.width]);
        
        function shorten(str) {
            let maxlen = 8;
            if (str.length > maxlen + 1)
                return str.substring(0, maxlen) + "...";
            else
                return str; 
        };

        // draw axes
        this.axisX.transition().call(d3.axisTop().scale(this.scaleX));
        this.axisY.transition().call(d3.axisLeft().scale(this.scaleY)).selectAll("text").text(shorten);

        let width = this.width, height = this.height, bar_width = this.bar_width;
        let scaleX = this.scaleX, scaleY = this.scaleY;
        let graph = this.graph;
        let deco = this.deco;

        // draw bars
        let stack = d3.stack().
            keys(keys).
            order(d3.stackOrderNone).
            offset(d3.stackOffsetNone);
        let series = stack(data);

        let i = series[0].length - 1;

        
        graph.selectAll(".rlabel")
            .data(series[series.length - 1].map(d => d[1]))
            .join("text")
            .classed("rlabel", true)
            .transition()
            .text(d => d)
            // .attr("transform", (d, i) =>  `translate(${ [scaleX(d) + 5, scaleY(dims[i])] })`)
            .attr("x", d => scaleX(d) + 5)
            .attr("y", (d, i) => scaleY(dims[i]))
            .attr("dominant-baseline", "middle");

        graph.selectAll(".series")
            .data(series)
            .join("g")
            .classed("series", true)
            .each(function(d, seriesId) {
                let g = d3.select(this);
                g.selectAll(".bar")
                    .data(d)
                    .join("rect")
                    .call(deco, seriesId, dims, keys)
                    .classed("bar", true)
                    .attr("width", d => scaleX(d[1]) - scaleX(d[0]))
                    .attr("height", bar_width)
                    .attr("transform", (d, i) => {
                        return `translate(${ [scaleX(d[0]) + 1, scaleY(dims[i]) - bar_width * 0.5] })`
                    })
            });
    }
}

let DType = {
    INTEGER: 0,
    FLOAT: 1,
    PERCENT: 2,
    STRING: 3
};

let dimType = {
    "序号": DType.INTEGER,
    "省份": DType.STRING,
    "单位名称": DType.STRING,
    "项数": DType.INTEGER, 
    "金额": DType.FLOAT, 
    "资助率": DType.PERCENT
};

function format(d) {
    for (let dim in d) {
        let v = d[dim];
        for (let t in dimType) {
            if (dim.indexOf(t) > -1) {
                if (dimType[t] == DType.INTEGER)
                    v = parseInt(v);
                else if (dimType[t] == DType.FLOAT)
                    v = parseFloat(v);
                else if (dimType[t] == DType.PERCENT)
                    v = v;
                else
                    v = v;
                break;
            }
        }
        d[dim] = v;
    }
    return d;
};

function readData(fn) {
    return d3.csv(fn, format);
}

let part1 = {
    rawData: undefined,
    rawDataP: undefined,
    region: undefined, 
    department: undefined, 
    choice: undefined,
    width: 1500,

    init() {
        this.g = d3.select("#mySVG").append("g");
        this.g.attr("transform", `translate(${[0, 0]})`)

        this.g3 = new StackedBarChartHorizontal(this.g, "2018 年面上项目资助情况（按地区统计）", 0, 0, this.width, 0, 10, this.deco_3);
        this.g1 = new StackedBarChartHorizontal(this.g, "2018 年面上项目资助经费大于2000万元单位", 0, 0, (this.width - 150) / 2, 0, 15, this.deco_1);
        this.g2 = new StackedBarChartHorizontal(this.g, "2018 年面上项目资助经费大于2000万元单位（按资助率统计）", 0, 0, (this.width - 150) / 2, 0, 15, this.deco_2);
    },

    deco_1(seriesBar, seriesId, dims, keys) {
        let colorArr = d3.schemeTableau10;
        let color = colorArr[departments.indexOf(keys[seriesId]) - 1];
        let tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html((d, i) => {
                return  `<strong>${dims[i]} 名次：</strong><span style = 'color:red'>${i + 1}</span><br>`+ 
                    `<strong>${keys[seriesId]} ${this.choice}：</strong><span style = 'color:red'>${d.data[keys[seriesId]]}</span>`
            });
        seriesBar.call(tip)
            .style("fill", color)
            .on("mouseover", function(d, i) {
                let t = d3.color(d3.select(this).style("fill"));
                d3.select(this).style("fill", t.brighter());
                tip.show(d, i);
            }).on("mouseout", function(d) {
                d3.select(this).style("fill", color);
                tip.hide();
            })    
    },

    deco_2(seriesBar, seriesId, dims, keys) {
        let colorArr = d3.schemeTableau10;
        let color = colorArr[seriesId];
        let tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html((d, i) => {
                return  `<strong>${dims[i]} 名次：</strong><span style = 'color:red'>${i + 1}</span><br>`+ 
                    `<strong>${keys[seriesId]} ${this.choice}：</strong><span style = 'color:red'>${d.data[keys[seriesId]]}</span><br>` +
                    `<strong>资助率：</strong><spa  n style = 'color:red'>${d3.format(".2%")(d.data["批准项数"] / (d.data["未批准项数"] + d.data["批准项数"]))}</span>`
            });
        seriesBar.call(tip)
            .style("fill", color)
            .on("mouseover", function(d, i) {
                let t = d3.color(d3.select(this).style("fill"));
                d3.select(this).style("fill", t.brighter());
                tip.show(d, i);
            }).on("mouseout", function(d) {
                d3.select(this).style("fill", color);
                tip.hide();
            })    
    },

    deco_3(seriesBar, seriesId, dims, keys) {
        let colorArr = d3.schemeTableau10;
        let color = colorArr[departments.indexOf(keys[seriesId]) - 1];
        let tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html((d, i) => {
                return  `<strong>${dims[i]} 名次：</strong><span style = 'color:red'>${i + 1}</span><br>`+ 
                    `<strong>${keys[seriesId]} ${this.choice}：</strong><span style = 'color:red'>${d.data[keys[seriesId]]}</span>`
            });
        seriesBar.call(tip)
            .style("fill", color)
            .on("mouseover", function(d, i) {
                let t = d3.color(d3.select(this).style("fill"));
                d3.select(this).style("fill", t.brighter());
                tip.show(d, i);
            }).on("mouseout", function(d) {
                d3.select(this).style("fill", color);
                tip.hide();
            })    
    },

    refresh() {
        let t = window.innerWidth || window.clientWidth || window.clientWidth;
        console.log(t)
        d3.select("#mySVG").attr("width", t);

        let colorArr = d3.schemeTableau10;
        part1.width = d3.select("#mySVG").attr("width") - 200;
        region = d3.select("#selectRegion option:checked").text();
        department = d3.select("#selectDepartment option:checked").text();
        choice = d3.select("#selectChoice option:checked").text();
        part1.region = region
        part1.department = department
        part1.choice = choice

        if (part1.department != "全部" || part1.choice != "项数") {
            part1.g2.caption.transition().style("opacity", 0).attr("visibility", "hidden");
            part1.g2.legends.transition().style("opacity", 0).attr("visibility", "hidden");
            part1.g2.graph.transition().style("opacity", 0).attr("visibility", "hidden");
            part1.g1.width = part1.width;
        } else {
            part1.g2.caption.transition().style("opacity", 1).attr("visibility", "visible");
            part1.g2.legends.transition().style("opacity", 1).attr("visibility", "visible");
            part1.g2.graph.transition().style("opacity", 1).attr("visibility", "visible");
            part1.g1.width = (part1.width - 150) / 2;
        }
        part1.g3.width = part1.width;
        part1.g2.width = (part1.width - 150) / 2;

        // choice filter
        let data = [];
        for (let i = 0; i < part1.rawData.length; i++) {
            let newEntry = {};
            for (let key in part1.rawData[i]) {
                if (key == "单位名称" || key == "省份" || key.indexOf(choice) > -1) {
                    newEntry[key.indexOf(choice) > -1? key.slice(0, -3): key] = part1.rawData[i][key];
                }
            }
            data.push(newEntry);
        }

        // region filter
        if (part1.region != "全部") {
            data = data.filter(entry => {
                return entry["省份"] == part1.region});
        }

        // department filter
        if (department != "全部") {
            data.forEach(entry => {
                for (let key in entry) {
                    if (key != "单位名称" && key != department) {
                        delete entry[key];
                    }
                }   
            })
        } else {
            data.forEach(entry => {
                for (let key in entry) {
                    if (key != "单位名称" && departments.indexOf(key) < 0) {
                        delete entry[key];
                    }
                }
            })
        }

        let keys = (department == "全部")? departments.slice(1): [department];
        data.sort((a, b) => {
            let getSum = (entry) => {
                let sum = 0;
                keys.forEach(key => sum += entry[key]);
                return sum;
            }
            return getSum(b) - getSum(a);
        })
        part1.g1.update(data, data.map(d => d["单位名称"]), keys, choice == "项数"? "项数(个)": "金额(万元)", key => colorArr[departments.indexOf(key) - 1]);



        keys = ["批准项数", "未批准项数"]
        data = [];
        for (let i = 0; i < part1.rawData.length; i++) {
            let d = part1.rawData[i];
            let newEntry = {
                "单位名称": d["单位名称"],
                "省份": d["省份"]
            };
            newEntry["批准项数"] = d["批准项数"];
            newEntry["未批准项数"] = d["申请项数"] - d["批准项数"];
            data.push(newEntry);
        }

        // region filter
        if (part1.region != "全部") {
            data = data.filter(entry => {
                return entry["省份"] == part1.region});
        }

        data.sort((a, b) => {
            return b["批准项数"] - a["批准项数"];
        })
        part1.g2.update(data, data.map(d => d["单位名称"]), keys, choice == "项数"? "项数(个)": "金额(万元)", key => colorArr[keys.indexOf(key)]);




        // choice filter
        data = [];
        for (let i = 0; i < part1.rawDataP.length; i++) {
            let newEntry = {};
            for (let key in part1.rawDataP[i]) {
                if (key.indexOf("批准") < 0 && (key == "省份" || key.indexOf(choice) > -1)) {
                    newEntry[key.indexOf(choice) > -1? key.slice(0, -3): key] = part1.rawDataP[i][key];
                }
            }
            data.push(newEntry);
        }

        // region filter
        if (part1.region != "全部") {
            data = data.filter(entry => {
                return entry["省份"] == part1.region});
        }


        keys = (department == "全部")? departments.slice(1): [department];

        part1.g3.update(data, data.map(d => d["省份"]), keys, choice == "项数"? "项数(个)": "金额(万元)", key => colorArr[departments.indexOf(key) - 1]);

        
        part1.g3.g.transition().attr("transform", `translate(${[100, 50]})`)
        part1.g1.g.transition().attr("transform", `translate(${[100, part1.g3.height + 150]})`)
        part1.g2.g.transition().attr("transform", `translate(${[part1.g1.width + 250, part1.g3.height + 150]})`)


        let svg = d3.select("#mySVG");
        svg.attr("height", part1.g1.height + part1.g3.height + 200);
    }
}

function main() {
    d3.select(window).on('resize.updatesvg', part1.refresh);
    readData("data/tab1.csv").then(rawd => {
        readData("data/tab2.csv").then(rawdP => {
            part1.rawData = rawd;
            part1.rawDataP = rawdP;
            part1.init()
            part1.refresh();
        });
    });
}

let regions = ['全部', '安徽', '北京', '重庆', '福建', '甘肃', '广东', '广西', '贵州', '海南', '河北', '河南', '黑龙江', '湖北', '湖南', '吉林', '江苏', '江西', '辽宁', '内蒙古', '宁夏', '青海', '山东', '山西', '陕西', '上海', '四川', '天津', '西藏', '新疆', '云南', '浙江'];
let departments = ['全部', '数理科学部', '化学科学部', '生命科学部', '地球科学部', '工程与材料科学部', '信息科学部', '管理科学部', '医学科学部'];
let choices = ['项数', '金额'];


let dropDowns = d3.selectAll("select")
    .data([regions, departments, choices])
    .on("change", part1.refresh)
    .selectAll("option")
    .data(d => d)
    .enter().append("option")
    .text(d => d)
    .attr("value", d => d);

main()