class Vec2d {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    mul(k) {
        return new Vec2d(this.x * k, this.y * k);
    }

    add(vec) {
        return new Vec2d(this.x + vec.x, this.y + vec.y);
    }

    sub(vec) {
        return new Vec2d(this.x - vec.x, this.y - vec.y);
    }

    neg() {
        return new Vec2d(-this.x, -this.y);
    }

    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    norm() {
        if (this.len() > 0)
            return this.mul(1 / this.len());
        else  
            return new Vec2d(0, 0);
    }

    angle() {
        let angle = Math.atan2(this.y, this.x);
        if (angle < 0) angle += 2 * Math.PI;
        return angle;
    }
}

class Node {
    constructor(id, label, pos=undefined) {
        this.id = id;
        this.label = label;
        this.pos = pos;
        this.disp = new Vec2d(0, 0);
        this.t = 0;
        this.d = 0;
        this.ldisp = new Vec2d(0, 0);
        this.deg = 0;
    }
}

class Edge {
    constructor(u, v) {
        this.u = u;
        this.v = v;
    }
}

function sqr(x) {
    return x * x;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

class fdg {
    constructor(graph) {
        this.width = 1630;
        this.height = 880;
        this.t_max = 1000;

        this.nodes = graph.nodes;
        this.edges = graph.edges;
        this.nodes.forEach(node => {
            let pos = new Vec2d(Math.random() * this.width, Math.random() * this.height);
            node.pos = pos;
            node.t = this.t_max;
            node.d = 0;
            node.ldisp = new Vec2d(0, 0);
        });
        this.edges.forEach(e => {
            e.u = this.nodes[e.u];
            e.v = this.nodes[e.v];
            e.u.deg++;
            e.v.deg++;
        });
        this.c = new Vec2d(0, 0);
        this.nodes.forEach(node => {
            this.c.x += node.pos.x;
            this.c.y += node.pos.y;
        });

        this.k_len_c = 0.8;
        this.k_grav = 0.4;
        this.k_rand = 128;

        this.k_rot = 1 / (2 * this.nodes.length);
        this.k_osc = 0.3;
        this.a_rot_c = 1 / 3;
        this.a_osc_c = 2 / 3;
    }

    reset() {
        this.nodes.forEach(node => {
            let pos = new Vec2d(Math.random() * this.width, Math.random() * this.height);
            node.pos = pos;
            node.t = this.t_max;
            node.d = 0;
            node.ldisp = new Vec2d(0, 0);
        });
        this.c = new Vec2d(0, 0);
        this.nodes.forEach(node => {
            this.c.x += node.pos.x;
            this.c.y += node.pos.y;
        });
    }

    draw() {
        let svg = d3.select("#mySVG");
    
        let ext = d3.extent(this.nodes, d => d.deg);

        svg.selectAll(".caption1")
            .data(["GLEISER,DANON--COLLABORATION IN JAZZ"])
            .join("text")
            .classed("caption1", true)
            .text(d => d)
            .attr("transform", `translate(${[this.width / 2, 20]})`)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold");

        svg.selectAll(".caption2")
            .data([`(${this.nodes.length} nodes, ${this.edges.length} edges)`])
            .join("text")
            .classed("caption2", true)
            .text(d => d)
            .attr("transform", `translate(${[this.width / 2, 40]})`)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle")
            .style("font-size", 12);

    
        svg.selectAll(".edge")
            .data(this.edges)
            .join("line")
            .classed("edge", true)
            .attr("x1", d => d.u.pos.x)
            .attr("y1", d => d.u.pos.y)
            .attr("x2", d => d.v.pos.x)
            .attr("y2", d => d.v.pos.y)
            .style("stroke", "steelblue")
            .style("stroke-width", 0.3);
    
        svg.selectAll(".node")
            .data(this.nodes)
            .join("circle")
            .classed("node", true)
            .attr("transform", d => `translate(${[d.pos.x, d.pos.y]})`)
            .attr("r", 3)
            .style("fill", d => d3.interpolateReds( 0.1 + 0.9 * (d.deg - ext[0]) / (ext[1] - ext[0]) ))
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .on("mouseover", d => {
                let highlights = [d];
                this.edges.forEach(edge => {
                    if (edge.u == d) {
                        highlights.push(edge.v);
                    } else if (edge.v == d) {
                        highlights.push(edge.u);
                    }
                })
                svg.selectAll(".node")
                    .transition()
                    .style("opacity", t => highlights.indexOf(t) > -1? 1: 0.3);
                svg.selectAll(".label")
                    .transition()
                    .style("opacity", t => highlights.indexOf(t) > -1? 1: 0.3)
                    .style("font-weight", t => highlights.indexOf(t) > -1? "bold": "normal");
                svg.selectAll(".edge")
                    .transition()
                    .style("opacity", t => (t.u == d || t.v == d)? 1: 0.1)
                    .style("stroke-width", t => (t.u == d || t.v == d)? 1: 0.5);
            }).on("mouseout", d => {
                svg.selectAll(".node")
                    .transition()
                    .style("opacity", 1);
                svg.selectAll(".label")
                    .transition()
                    .style("opacity", 1)
                    .style("font-weight", "normal");
                svg.selectAll(".edge")
                    .transition()
                    .style("opacity", 1)
                    .style("stroke-width", 0.5);
            });
    
        svg.selectAll(".label")
            .data(this.nodes)
            .join("text")
            .classed("label", true)
            .attr("transform", d => `translate(${[d.pos.x, d.pos.y - 9]})`)
            .text(d => d.label)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", 12);

        toggleLabels();
    }

    iterate() {
        let nodes = this.nodes;
        let edges = this.edges;
        let width = this.width;
        let height = this.height;

        let t_max = this.t_max;
        let a_rot = this.a_rot_c * Math.PI;
        let a_osc = this.a_osc_c * Math.PI;
        let k_rot = this.k_rot;
        let k_osc = this.k_osc;
        let k_grav = this.k_grav;
        let k_rand = this.k_rand;
        let k_len_c = this.k_len_c;
        let k_len = k_len_c * Math.sqrt(width * height / nodes.length);
        
        let c = this.c;

        let f_a = x => sqr(x) / k_len;
        let f_r = x => (x > 0)? sqr(k_len) / x: 0;

        // repulsive forces
        nodes.forEach(u => {
            u.disp = c.mul(1 / this.nodes.length).sub(u.pos).mul(k_grav).mul(1 + u.deg / 2);
            u.disp.x += (Math.random() - 0.5) * k_rand;
            u.disp.y += (Math.random() - 0.5) * k_rand;
            nodes.forEach(v => {
                if (u == v) return;
                let d = u.pos.sub(v.pos);
                u.disp = u.disp.add(d.norm().mul(f_r(d.len())));
            });
        })

        // attractive forces
        edges.forEach(e => {
            let d = e.v.pos.sub(e.u.pos);
            e.u.disp = e.u.disp.add(d.norm().mul(f_a(d.len())));
            e.v.disp = e.v.disp.sub(d.norm().mul(f_a(d.len())));
        })

        
        // frame repulsion forces
        nodes.forEach(u => {
            let k_frame = sqr(t_max);
            u.disp.x += Math.min(sqr(t_max), k_frame / sqr(u.pos.x));
            u.disp.x -= Math.min(sqr(t_max), k_frame / sqr(width - u.pos.x));
            u.disp.y += Math.min(sqr(t_max), k_frame / sqr(u.pos.y)) * 2;
            u.disp.y -= Math.min(sqr(t_max), k_frame / sqr(height - u.pos.y)) * 0.1;
        })

        // update temperature
        let mxt = 0;
        nodes.forEach(v => {
            if (v.disp.x != 0 && v.disp.y != 0) {
                v.disp = v.disp.norm().mul(v.t);
                let npos = v.pos.add(v.disp);
                npos.x = Math.min(width, Math.max(0, npos.x));
                npos.y = Math.min(height, Math.max(0, npos.y));
                v.disp = npos.sub(v.pos);
                v.pos = v.pos.add(v.disp);
                c = c.add(v.disp);
            }
            if (v.ldisp.x != 0 && v.ldisp.y != 0) {
                let ang = v.disp.angle() - v.ldisp.angle();
                let angs = Math.sin(ang), angc = Math.cos(ang);
                if (Math.abs(angs) >= Math.sin(Math.PI / 2 + a_rot / 2)) {
                    v.d += k_rot * Math.sign(angs);
                }
                if (Math.abs(angc) >= Math.cos(a_osc / 2)) {
                    v.t += v.t * k_osc * angc;
                }
                v.t *= 1 - Math.abs(v.d);
                v.t = Math.min(v.t, t_max);
            }
            v.ldisp.x = v.disp.x;
            v.ldisp.y = v.disp.y;
            mxt = Math.max(mxt, v.t);
        });

        return mxt;
    }

}

function readData() {
    return d3.csv("data/jazz.csv");
}

function prepare(d) {
    let graph = {
        nodes: [],
        edges: []
    }
    for (let i = 0; i < d.length; i++) {
        graph.nodes.push(new Node(i, `${i + 1}`));
        for (let j in d[i]) {
            if (i < j && d[i][j] == "1") {
                graph.edges.push(new Edge(i, j - 1));
            }
        }
    }
    return graph;
}

let g, iter;
let flag = true;
let plist = ["width", "height", "t_max", "t_min", "k_grav", "k_rand", "k_len_c", "k_rot", "k_osc", "a_rot_c", "a_osc_c"];
let t_min = 1;

async function loop() {
    let t1 = new Date();
    while (flag) {
        iter++;
        let mxt = g.iterate();
        d3.select("#indicator")
            .text(`Iteration ${iter}, max temp = ${mxt.toFixed(3)}`);
        if (mxt < t_min) {
            toggle(); break;
        }
        let showProgress = d3.select("#chkShowProgress").property("checked");
        if (showProgress) {
            g.draw();
            await sleep(1);
        } else if (iter % 50 == 0)
            await sleep(1);
    }
    g.draw();
    let t2 = new Date();
    console.log((t2.getSeconds() - t1.getSeconds()) * 1000 + t2.getMilliseconds() - t1.getMilliseconds());
}

function updateParams() {
    d3.select("#mySVG")
        .attr("width", eval(d3.select("#inp_width").property("value")))
        .attr("height", eval(d3.select("#inp_height").property("value")));
    plist.forEach(name => {
        if (name != "t_min")
            g[name] = eval(d3.select(`#inp_${name}`).property("value"));
        else
            t_min = eval(d3.select(`#inp_${name}`).property("value"));
    })
}

function toggle() {
    flag = !flag;
    d3.select("#btnToggle").text(flag? "Pause": "Continue");
    updateParams();
    if (flag) 
        loop();
    else
        g.draw();
}

function toggleLabels() {
    let svg = d3.select("#mySVG");
    svg.selectAll(".label")
        .transition()
        .attr("visibility", d3.select("#chkShowLabels").property("checked")? "visible": "hidden");
}

async function reset() {
    flag = false;
    await sleep(1);
    d3.select("#mySVG").selectAll("*").remove();
    updateParams();
    g.reset();
    flag = true;
    d3.select("#btnToggle").text("Pause");
    iter = 0;
    loop();
}

readData().then(async (d) => {
    g = new fdg(prepare(d));

    d3.select("#mySVG")
        .attr("width", g.width)
        .attr("height", g.height);

    let pdiv = d3.select("#params");
    plist.forEach(name => {
        pdiv.append("div")
            .classed("lblInput", true)
            .text(name);
        pdiv.append("input")
            .classed("inpParam", true)
            .attr("id", `inp_${name}`)
            .attr("value", name != "t_min"? eval("g." + name): t_min);
    })

    iter = 0;
    
    loop();
})