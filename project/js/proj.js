let svg, g_inst, g_fac_hist, g_fac;
let rawd, d_region, d_inst_all, d_fac_all, d_fac;
let sel_insts = [], sel_range = undefined, c_fac;
let col = {
    "ai": d3.schemeTableau10[0],
    "system": d3.schemeTableau10[1],
    "theory": d3.schemeTableau10[2],
    "interdisciplinary": d3.schemeTableau10[3]
};

let areaname = {
    'all': 'All areas',
    'all_ai': 'AI',
    'ai': 'Artificial intelligence',
    'vision': 'Computer vision',
    'mlmining': 'Machine learning & data mining',
    'nlp': 'Natural language processing',
    'ir': 'The Web & information retrieval',
    'all_system': 'Systems',
    'arch': 'Computer architecture',
    'comm': 'Computer networks',
    'sec': 'Computer security',
    'mod': 'Databases',
    'da': 'Design automation',
    'bed': 'Embedded & real-time systems',
    'hpc': 'High-performance computing',
    'mobile': 'Mobile computing',
    'metrics': 'Measurement & perf. analysis',
    'ops': 'Operating systems',
    'plan': 'Programming languages',
    'soft': 'Software engineering',
    'all_theory': 'Theory',
    'act': 'Algorithms & complexity',
    'crypt': 'Cryptography',
    'log': 'Logic & verification',
    'all_inter': 'Interdisciplinary Areas',
    'bio': 'Comp. bio & bioinformatics',
    'graph': 'Computer graphics',
    'ecom': 'Economics & computation',
    'chi': 'Human-computer interaction',
    'robotics': 'Robotics',
    'visualization': 'Visualization'
};

let fieldname = {
    "ai": "AI",
    "system": "System",
    "theory": "Theory",
    "interdisciplinary": "Interdisciplinary"
};

class SBC_inst {
    constructor(svg, x, y, width, height, bar_width, bar_padding) {
        this.svg = svg;
        [this.x, this.y] = [x, y];
        this.extentX = this.scaleX = this.scaleY = null;
        [this.width, this.height, this.bar_width, this.bar_padding] = [width, height, bar_width, bar_padding];
        this.dims = [];

        this.bg = this.svg.append("g");
        this.g = this.svg.append("g");
        this.caption = this.svg.append("text")
            .classed("caption", true)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Rankings of Institutions");
    }

    update(data) {
        this.caption.attr("transform", `translate(${[this.x, this.y]})`)
        this.g.attr("transform", `translate(${[this.x, this.y + 20]})`)
        this.bg.attr("transform", `translate(${[this.x, this.y + 20]})`)

        let fields = data.fields;
        let entities = data.entities;
        let count = [];
        entities.forEach(entity => count.push(data.count[entity]));

        this.height = entities.length * this.bar_width + (entities.length - 1) * this.bar_padding * 2;

        this.extentX = d3.extent(count, d => {
            let sum = 0;
            fields.forEach(field => sum += d[field]);
            return sum;
        });
        this.scaleY = d3.scalePoint()
            .domain(entities)
            .range([0, this.height])
            .padding(0.5);
        this.scaleX = d3.scaleLinear()
            .domain([0, this.extentX[1]])
            .range([240, this.width - 40]);
       
        let width = this.width, height = this.height, bar_width = this.bar_width, bar_padding = this.bar_padding;
        let scaleX = this.scaleX, scaleY = this.scaleY;
        let g = this.g;

        let stack = d3.stack()
            .keys(fields)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);
        let series = stack(count);

        this.bg.selectAll(".bgbar")
            .data(entities)
            .join("rect")
            .classed("bgbar", true)
            .attr("transform", d => `translate(${[0, scaleY(d) - bar_width / 2 - bar_padding]})`)
            .attr("width", width)
            .attr("height", bar_width + bar_padding * 2)
            .style("fill", (d, i) => (i % 2 == 0)? "#F0F0F0": "white")
            .on("click", (d) => {
                let p = sel_insts.indexOf(d);
                if (p == -1)
                    sel_insts.push(d);
                else
                    sel_insts.splice(p, 1);

                this.bg.selectAll(".bgbar")
                    .style("fill", (d, i) => sel_insts.indexOf(d) > -1? "grey": ((i % 2 == 0)? "#F0F0F0": "white"));
                
                d_fac = prep_fac(sel_insts.length > 0? d_region.filter(d => sel_insts.indexOf(d["institution"]) > -1): d_region);
                d_fac.entities.sort((a, b) => {
                    return sumdict(d_fac.count[b]) - sumdict(d_fac.count[a]);
                })
                g_fac_hist.update(d_fac_all, d_fac);
                let s = sel_range.map(d => y.invert(d));
                g_fac.update(filter_fac_count(d_fac, s));
            });

        g.selectAll(".entrank")
            .data(entities)
            .join("text")
            .classed("entrank", true)
            .text((d, i) => i + 1)
            .attr("x", 5)
            .attr("y", d => scaleY(d))
            .attr("dominant-baseline", "central");

        g.selectAll(".entlabel")
            .data(entities)
            .join("text")
            .classed("entlabel", true)
            .text(d => d)
            .attr("x", 35)
            .attr("y", d => scaleY(d))
            .attr("dominant-baseline", "central")
            .on("mouseover", function (d) {
                console.log(c_fac);
                show_info(data_dict, d, c_fac[d]);
                d3.select(this).style("font-weight", "bold");

                let inst = d;

                g_fac.g.selectAll(".entlabel")
                    .style("font-weight", d => d_fac_all.inst[d] == inst? "bold": "normal");
                g_fac.bg.selectAll(".bgbar")
                    .style("stroke", "black")
                    .style("stroke-width", d => d_fac_all.inst[d] == inst? 1: 0);
                g_fac.bg.selectAll(".bgbar")
                    .sort((a, b) => (d_fac_all.inst[a] == inst) - (d_fac_all.inst[b] == inst));

            }).on("mouseout", function(d) {
                d3.select(this).style("font-weight", "normal");

                g_fac.g.selectAll(".entlabel")
                    .style("font-weight", "normal");
                g_fac.bg.selectAll(".bgbar")
                    .style("stroke", "black")
                    .style("stroke-width", 0);
            })

        g.selectAll(".rlabel")
            .data(series[series.length - 1].map(d => d[1]))
            .join("text")
            .classed("rlabel", true)
            .text(d => d)
            .attr("x", d => scaleX(d) + 5)
            .attr("y", (d, i) => scaleY(entities[i]))
            .attr("dominant-baseline", "central");
        
        g.selectAll(".series")
            .data(series)
            .join("g")
            .classed("series", true)
            .each(function(d, seriesId) {
                let g = d3.select(this);
                let color = col[data.fields[seriesId]];

                let tip = d3.tip()
                    .attr("class", "d3-tip")
                    .offset([-5, 0])
                    .html((d, i) => {
                        return `<strong>${fieldname[data.fields[seriesId]]}</strong>: ${d[1] - d[0]}`;
                    });

                g.selectAll(".bar")
                    .data(d)
                    .join("rect")
                    .classed("bar", true)
                    .attr("width", d => scaleX(d[1]) - scaleX(d[0]))
                    .attr("height", bar_width)
                    .attr("transform", (d, i) => {
                        return `translate(${ [scaleX(d[0]) + 1, scaleY(entities[i]) - bar_width * 0.5] })`
                    })
                    .style("fill", color)
                    .call(tip)
                    .on("mouseover", function(d, i) {
                        let t = d3.color(d3.select(this).style("fill"));
                        d3.select(this).style("fill", t.brighter());
                        tip.show(d, i);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("fill", color);
                        tip.hide();
                    })
            });
        
    }
}

class SBC_fac {
    constructor(svg, x, y, width, height, bar_width, bar_padding) {
        this.svg = svg;
        [this.x, this.y] = [x, y];
        this.extentX = this.scaleX = this.scaleY = null;
        [this.width, this.height, this.bar_width, this.bar_padding] = [width, height, bar_width, bar_padding];
        this.dims = [];

        this.bg = this.svg.append("g");
        this.g = this.svg.append("g");

        this.caption = this.svg.append("text")
            .classed("caption", true)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Rankings of Faculties");
    }

    update(data) {
        this.caption.attr("transform", `translate(${[this.x, this.y]})`)
        this.g.attr("transform", `translate(${[this.x, this.y + 20]})`)
        this.bg.attr("transform", `translate(${[this.x, this.y + 20]})`)

        let fields = data.fields;
        let entities = data.entities;
        let count = [];
        entities.forEach(entity => count.push(data.count[entity]));

        this.height = entities.length * this.bar_width + (entities.length - 1) * this.bar_padding * 2;

        this.extentX = d3.extent(count, d => {
            let sum = 0;
            fields.forEach(field => sum += d[field]);
            return sum;
        });
        this.scaleY = d3.scalePoint()
            .domain(entities)
            .range([0, this.height])
            .padding(0.5);
        this.scaleX = d3.scaleLinear()
            .domain([0, this.extentX[1]])
            .range([200, this.width - 40]);
       
        let width = this.width, height = this.height, bar_width = this.bar_width, bar_padding = this.bar_padding;
        let scaleX = this.scaleX, scaleY = this.scaleY;
        let g = this.g;

        let stack = d3.stack()
            .keys(fields)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);
        let series = stack(count);

        this.bg.selectAll(".bgbar")
            .data(entities)
            .join("rect")
            .classed("bgbar", true)
            .attr("transform", d => `translate(${[0, scaleY(d) - bar_width / 2 - bar_padding]})`)
            .attr("width", width)
            .attr("height", bar_width + bar_padding * 2)
            .style("fill", (d, i) => (i % 2 == 0)? "#F0F0F0": "white");

        g.selectAll(".entrank")
            .data(entities)
            .join("text")
            .classed("entrank", true)
            .text((d, i) => i + 1)
            .attr("x", 5)
            .attr("y", d => scaleY(d))
            .attr("dominant-baseline", "central");

        g.selectAll(".entlabel")
            .data(entities)
            .join("text")
            .classed("entlabel", true)
            .text(d => d)
            .attr("x", 35)
            .attr("y", d => scaleY(d))
            .attr("dominant-baseline", "central")
            .on("mouseover", function (d) {

                let t = [];
                for (let area in d_fac.count_area[d]) 
                    t.push([areaname[area], d_fac.count_area[d][area]]);
                t.sort((a, b) => (b[1] - a[1]));

                let inst = d_fac.inst[d];
                show_info_fac(d, d_fac.inst[d], t);
                d3.select(this).style("font-weight", "bold");
                
                g_inst.g.selectAll(".entlabel")
                    .style("font-weight", d => d == inst? "bold": "normal");
                g_inst.bg.selectAll(".bgbar")
                    .style("stroke", "black")
                    .style("stroke-width", d => d == inst? 1: 0);
                g_inst.bg.selectAll(".bgbar")
                    .sort((a, b) => (a == inst) - (b == inst));

            }).on("mouseout", function(d) {
                d3.select(this).style("font-weight", "normal");

                g_inst.g.selectAll(".entlabel")
                    .style("font-weight", "normal");
                g_inst.bg.selectAll(".bgbar")
                    .style("stroke-width", 0);
            })

        g.selectAll(".rlabel")
            .data(series[series.length - 1].map(d => d[1]))
            .join("text")
            .classed("rlabel", true)
            .text(d => d)
            .attr("x", d => scaleX(d) + 5)
            .attr("y", (d, i) => scaleY(entities[i]))
            .attr("dominant-baseline", "central");
        
            
        g.selectAll(".series")
            .data(series)
            .join("g")
            .classed("series", true)
            .each(function(d, seriesId) {
                let g = d3.select(this);
                let color = col[data.fields[seriesId]];

                let tip = d3.tip()
                    .attr("class", "d3-tip")
                    .offset([-5, 0])
                    .html((d, i) => {
                        return `<strong>${fieldname[data.fields[seriesId]]}</strong>: ${d[1] - d[0]}`;
                    });

                g.selectAll(".bar")
                    .data(d)
                    .join("rect")
                    .classed("bar", true)
                    .attr("width", d => scaleX(d[1]) - scaleX(d[0]))
                    .attr("height", bar_width)
                    .attr("transform", (d, i) => {
                        return `translate(${ [scaleX(d[0]) + 1, scaleY(entities[i]) - bar_width * 0.5] })`
                    })
                    .style("fill", color)
                    .call(tip)
                    .on("mouseover", function(d, i) {
                        let t = d3.color(d3.select(this).style("fill"));
                        d3.select(this).style("fill", t.brighter());
                        tip.show(d, i);
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("fill", color);
                        tip.hide();
                    })
            });
        
    }
}

class Hist_fac {
    constructor(svg, x, y, width, height) {
        this.svg = svg;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.g = svg.append("g");

        this.axisX = this.g.append("g");
        this.axisY = this.g.append("g");

        this.brush = d3.brushY()
            .extent([[-5, 0], [this.width, this.height]]);

        this.caption = this.svg.append("text")
            .classed("caption", true)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Distribution of Faculties");

        this.lblX = this.g.append("text")
            .attr("class", "x label")
            .attr("x", this.width - 130)
            .attr("y", 45)
            .text("x - Number of Faculties");
        this.lblX = this.g.append("text")
            .attr("class", "x label")
            .attr("x", this.width - 130)
            .attr("y", 58)
            .text("y - Pubs per Faculty");
    }

    update(data, data_sel) {
        this.caption.attr("transform", `translate(${[this.x, this.y]})`);
        this.g.attr("transform", `translate(${[this.x, this.y + 22]})`);

        data = data.entities.map(fac => sumdict(data.count[fac]));
        data_sel = data_sel.entities.map(fac => sumdict(data_sel.count[fac]));

        let extent = d3.extent(data);

        let x = d3.scaleSymlog()
            .range([0, this.width]);
        let y = d3.scaleLinear()
            .domain(extent)
            .range([0, this.height]);

        let nBin = 15;
        let hist = d3.histogram()
            .value(d => d)
            .domain(y.domain())
            .thresholds(nBin);

        let bins = hist(data).filter(d => d.length > 0);
        x.domain([0, d3.max(bins, d => d.length)]);
    
        let ticks = [];
        
        for (let i = 1; i <= x.domain()[1]; i *= 2)
            ticks.push(i);
        this.axisX
            .call(d3.axisTop(x).tickValues(ticks));
        this.axisY
            .call(d3.axisLeft(y).ticks(nBin - 1));
            
        this.g.selectAll(".bar")
            .data(bins)
            .join("rect")
            .classed("bar", true)
            .attr("transform", d => `translate(${[1, y(d.x0) + 1]})`)
            .attr("width", d => x(d.length))
            .attr("height", d => y(d.x1) - y(d.x0) - 2)
            .style("fill", "steelblue");

        let bins_sel = hist(data_sel).filter(d => d.length > 0);
        this.g.selectAll(".bar_sel")
            .data(bins_sel)
            .join("rect")
            .classed("bar_sel", true)
            .style("fill", "orange")
            .attr("transform", d => `translate(${[1, y(d.x0) + 1]})`)
            .transition()
            .attr("width", d => x(d.length))
            .attr("height", d => y(d.x1) - y(d.x0) - 2);
        
        this.brush.on("brush end", function () {
            sel_range = d3.event.selection;
            let s = sel_range.map(d => y.invert(d));
            //console.log("hi", sel_range);
            //console.log(filter_fac_count(d_fac, s));

            g_fac.update(filter_fac_count(d_fac, s));
            svg.attr("height", Math.max(g_inst.height, g_fac_hist.height + g_fac.height) + 150);
            d3.select(".g1").attr("height", Math.max(g_inst.height, g_fac_hist.height + g_fac.height) + 150 + "px");
        });
        
        let ir = y.range();
        ir[0] = ir[1] / 3;
    
        this.g.selectAll(".brush").remove();
        this.brushg = this.g.append("g")
            .classed("brush", true)
            .call(this.brush)
            .call(this.brush.move, (sel_range != undefined)? sel_range: ir);
    }
}

function readData() {
    return d3.json("data/new_articles.json");
}

function prep_inst(data) {
    let res = {}, insts = [], fields = [];
    data.forEach(d => {
        if (fields.indexOf(d.field) == -1)
            fields.push(d.field);
        if (insts.indexOf(d.institution) == -1)
            insts.push(d.institution);

        if (!(d.institution in res))
            res[d.institution] = {};
        if (!(d.field in res[d.institution]))
            res[d.institution][d.field] = 0;
        res[d.institution][d.field]++;
    });

    fields.sort();

    insts.forEach(inst => {
        fields.forEach(field => {
            if (!(field in res[inst]))
                res[inst][field] = 0;
        })
    })

    return {
        "entities": insts,
        "fields": fields,
        "count": res
    }    
}

function prep_fac(data) {
    let res = {}, facs = [], fields = [];
    let areas = [], c_area = {}, inst = {};
    data.forEach(d => {
        if (fields.indexOf(d.field) == -1)
            fields.push(d.field);
        if (areas.indexOf(d.subArea) == -1)
            areas.push(d.subArea);
        if (facs.indexOf(d.name) == -1)
            facs.push(d.name);

        if (!(d.name in res)) {
            res[d.name] = {};
            inst[d.name] = d.institution;
        }
        if (!(d.field in res[d.name]))
            res[d.name][d.field] = 0;
        res[d.name][d.field]++;

        if (!(d.name in c_area))
            c_area[d.name] = {};
        if (!(d.subArea in c_area[d.name]))
            c_area[d.name][d.subArea] = 0;
        c_area[d.name][d.subArea]++;
    });

    fields.sort();
    areas.sort();

    facs.forEach(fac => {
        fields.forEach(field => {
            if (!(field in res[fac]))
                res[fac][field] = 0;
        })
    })

    return {
        "entities": facs,
        "fields": fields,
        "areas": areas,
        "count": res,
        "count_area": c_area,
        "inst": inst,
    }    
}

function sumdict(dict) {
    let sum = 0;
    for (key in dict)
        sum += dict[key];
    return sum;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function filter_fac_count(d_fac, range) {
    t = clone(d_fac);
    t.entities = t.entities.filter(fac => sumdict(t.count[fac]) >= range[0] && sumdict(t.count[fac]) <= range[1]);
    return t;
}

function get_data_filtered() {
    let data = clone(rawd);
    let region = d3.select("#regions").property("value");
    let trange = d3.select(".range-slider").property("value").split(",").map(d => parseInt(d));
    console.log(region, trange);

    // filter with region
    let f_region = (region) => {
        if (["usa", "canada", "southamerica", "asia", "europe", "africa"].indexOf(region) > -1)
            return (d) => (d.region == region);
        if (region == "northamerica")
            return (d) => (d.region == "usa" || d.region == "canada");
        if (region == "world")
            return (d) => (true);
    }
    data = data.filter(f_region(region));

    // filter with time
    data = data.filter(d => d.year >= trange[0] && d.year <= trange[1]);

    // filter with areas
    data = data.filter(d => sel_areas.indexOf(d.subArea) > -1);

    return data;
}



function refresh() {

    d_region = get_data_filtered();

    d_inst_all = prep_inst(d_region);
    d_fac_all = prep_fac(d_region);

    c_fac = {};
    d_fac_all.entities.forEach(fac => {
        if (d_fac_all.inst[fac] in c_fac)
            c_fac[d_fac_all.inst[fac]]++;
        else
            c_fac[d_fac_all.inst[fac]] = 1;
    });

    //d_inst_all.fields.forEach((d, i) => col[d] = d3.schemeTableau10[i]);

    d_inst_all.entities.sort((a, b) => {
        return sumdict(d_inst_all.count[b]) - sumdict(d_inst_all.count[a]);
    })
    d_fac_all.entities.sort((a, b) => {
        return sumdict(d_fac_all.count[b]) - sumdict(d_fac_all.count[a]);
    })

    svg = d3.select("#svg1");
    svg.selectAll("*").remove();

    let w = 760;

    g_inst = new SBC_inst(svg, 0, 25, w, 1000, 16, 1);
    g_inst.update(d_inst_all);
    svg.attr("height", g_inst.height + 100).attr("width", 800);
    
    g_fac = new SBC_fac(svg, w + 50, 277, w, 1000, 16, 1);
    g_fac.update(d_fac_all);

    g_fac_hist = new Hist_fac(svg, w + 50, 25, w, 200);
    d_fac = d_fac_all;
    g_fac_hist.update(d_fac_all, d_fac);
}

readData().then(data => {
    rawd = data;
    refresh();
})