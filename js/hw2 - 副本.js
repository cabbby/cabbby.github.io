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

    toString() {
        return `(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
    }
}

class Node {
    constructor(id, label, pos=undefined) {
        this.id = id;
        this.label = label;
        this.pos = pos;
        this.disp = new Vec2d(0, 0);
    }
}

class Edge {
    constructor(u, v) {
        this.u = u;
        this.v = v;
    }
}

/*
let c = 1;
let k = c * Math.sqrt(width * height / v_cnt);

function f_a(x) {
    return Math.log(x) * 20;
}

function f_r(x) {
    return 20 * k * k / (x * x);
}

function cool(t) {
    if (t > 100)
        return t * 0.98;
    else
        return t * 0.9;
}
*/

function sqr(x) {
    return x * x;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function refresh(nodes, edges) {
    let svg = d3.select("#mySVG");

    let g_edges = svg.selectAll(".edge")
        .data(edges)
        .join("line")
        .classed("edge", true)
        .attr("x1", d => d.u.pos.x)
        .attr("y1", d => d.u.pos.y)
        .attr("x2", d => d.v.pos.x)
        .attr("y2", d => d.v.pos.y)
        .style("stroke", "red")
        .style("stroke-width", 1);

    let g_nodes = svg.selectAll(".node")
        .data(nodes)
        .join("g")
        .classed("node", true)
        .attr("transform", d => `translate(${[d.pos.x, d.pos.y]})`)
        .each(function(d) {
            d3.select(this).selectAll("circle")
                .data([d])
                .join("circle")
                .attr("r", 20)
                .style("fill", "steelblue");
            d3.select(this).selectAll("text")
                .data([d])
                .join("text")
                .text(d => d.label)
                .attr("alignment-baseline", "middle")
                .attr("text-anchor", "middle")
                .style("fill", "black")
                .style("font-size", 20);
        })
        /*
    g_nodes.select("circle")
        .join(d => console.log(d))
        .attr("r", 20)
        .style("fill", "steelblue");*/
        /*
    g_nodes.select("text")
        .text(d => d.label)
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", 20);*/
}

async function main(graph) {
    let width = 1600;
    let height = 1600;

    let nodes = graph.nodes;
    let edges = graph.edges;
    nodes.forEach(node => {
        let pos = new Vec2d(Math.random() * width, Math.random() * height);
        node.pos = pos;
    })
    edges.forEach(e => {
        e.u = nodes[e.u];
        e.v = nodes[e.v];
    });

    let iterations = 1600;
    let c = 0.5;
    let k = c * Math.sqrt(width * height / nodes.length);
    let t_initial = 800, t_stage = 100;
    
    function f_a(x) {
        return x * x * x/ (k * k);
    }
    
    function f_r(x) {
        if (x > 0)
            return k * k / x;
        else
            return 0;
    }


    /*
    function f_a(x) {
        if (x > 0)
            return 20 * Math.log(x / 10);
        else
            return 0;
    }
    
    function f_r(x) {
        if (x > 0)
            return 20 * k * k / (x * x);
        else
            return 0;
    }
    */
    
    function cool(t) {
        if (t > t_stage)
            return t * 0.99;
        else 
            return t * 0.995;
    }

    console.log(nodes);


    
    let t = t_initial;
    for (let i = 0; i < iterations; i++) {
        
        // repulsive forces
        nodes.forEach(u => {
            u.disp.x = u.disp.y = 0;
            nodes.forEach(v => {
                if (u == v) return;
                let d = u.pos.sub(v.pos);
                u.disp = u.disp.add(d.norm().mul(f_r(d.len())));
            })
        })
        
        
        // attractive forces
        edges.forEach(e => {
            d = e.v.pos.sub(e.u.pos);
            e.u.disp = e.u.disp.add(d.norm().mul(f_a(d.len())));
            e.v.disp = e.v.disp.sub(d.norm().mul(f_a(d.len())));
        })
        

        
        // frame repulsion forces
        nodes.forEach(u => {
            let k_frame = 10000000;
            u.disp.x += Math.min(1000, k_frame / sqr(u.pos.x));
            u.disp.x -= Math.min(1000, k_frame / sqr(width - u.pos.x));
            u.disp.y += Math.min(1000, k_frame / sqr(u.pos.y));
            u.disp.y -= Math.min(1000, k_frame / sqr(height - u.pos.y));
        })
        
        // frame
        nodes.forEach(u => {
            let a = u.disp.norm().mul(Math.min(u.disp.len(), t));
            // let a = u.disp.mul(t / t_initial);
            u.pos = u.pos.add(a);
            u.pos.x = Math.min(width, Math.max(0, u.pos.x));
            u.pos.y = Math.min(height, Math.max(0, u.pos.y));
        })

        
        if (t < t_stage)
            refresh(nodes, edges);

        //console.log(i)
        t = cool(t);
        await sleep(1)
    }
    
    refresh(nodes, edges);
}

function readData() {
    return d3.json("data/honglou.json");
}

function getGraph(hl) {
    let idmap = [], tnodes = [], tedges = [];
    let graph = {
        nodes: [],
        edges: []
    }
    let v_cnt = 0, deg = [];
    hl.data.nodes.forEach(node => {
        if (node.categories[0] == "person" && node.value > 1) {
            idmap[node.id] = v_cnt;
            tnodes.push(new Node(v_cnt, node.label));
            deg.push(0);
            v_cnt++;
        }
    })

    hl.data.edges.forEach(edge => {
        if (idmap[edge.from] != undefined && idmap[edge.to] != undefined) {
            let u = idmap[edge.from], v = idmap[edge.to];
            if (u > v) {
                let t = u; u = v; v = t;
            }
            let flag = true;
            for (let i in tedges) {
                if (tedges[i].u == u && tedges[i].v == v) {
                    flag = false; break;
                }
            }

            if (flag) {
                tedges.push(new Edge(idmap[edge.from], idmap[edge.to]));
                deg[idmap[edge.from]]++;
                deg[idmap[edge.to]]++;
            }
        }
    })

    v_cnt = 0;
    idmap = [];
    tnodes.forEach(node => {
        if (deg[node.id] > 2) {
            idmap[node.id] = v_cnt;
            graph.nodes.push(new Node(v_cnt, node.label));
            v_cnt++;
        }
    })
    tedges.forEach(edge => {
        if (idmap[edge.u] != undefined && idmap[edge.v] != undefined) {
            graph.edges.push(new Edge(idmap[edge.u], idmap[edge.v]));
        }
    })
    console.log(graph)
    return graph;
}

readData().then((hl) => {
    main(getGraph(hl));
})