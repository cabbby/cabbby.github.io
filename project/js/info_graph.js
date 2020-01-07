

var node_link_data;
var OPACITY = {
    node: 1,
    link: 0.8
};

var regions = ['africa', 'asia', 'australasia', 'canada', 'europe', 'none', 'southamerica'];
function show(data_dict, iter = 'Peking University'){
    d3.select('.rightBar').classed('rightBar-moved', true);
    d3.select('#bar_image1').attr('src', data_dict[iter].pic[0])
    // d3.select('#bar_image2').attr('src', data_dict[iter].pic[1])
    
    // 这里调取了图片
    document.getElementById('bar_name').innerHTML = iter;
    document.getElementById('bar_homepage').innerHTML = data_dict[iter].homepage;
    document.getElementById('bar_region').innerHTML = data_dict[iter].region;

}
function unshow()
{
    d3.select('.rightBar').classed('rightBar-moved', false);
    d3.select('#bar_image1').attr('src','')
    document.getElementById('bar_name').innerHTML = '';
    document.getElementById('bar_homepage').innerHTML = '';
    document.getElementById('bar_region').innerHTML = '';
}
// main()


function init_data(origin_data){
    data_dict = {}

    for (var i = origin_data.length - 1; i >= 0; i--) {
        data_dict[origin_data[i].institution] = {'region':origin_data[i].region,'homepage':origin_data[i].homepage,'pic':origin_data[i].pic}
    }
    return data_dict;
}
d3.json('data/institution_info.json',function(data){
    // console.log(data);
    data_dict = init_data(data);

    // show(data_dict);
    // unshow();

})

function chart1() {
    // d3.select("#chart1").select("svg").remove();
      var width = 1400,
          height = 700;

      var color = d3.scale.category20();
      // var color = d3.scaleLinear()
      //   .domain([0, 100])
      //   .range(["brown", "steelblue"]);

      var fisheye = d3.fisheye.circular()
          .radius(60);

      var force = d3.layout.force()
          .charge(-960)
          .linkDistance(80)
          .size([width, height]);

      var svg = d3.select("#chart1").append("svg")
          .attr("width", width)
          .attr("height", height);

      svg.append("rect")
          .attr("class", "background")
          .attr("width", width)
          .attr("height", height);

      d3.json("data/node_link_school.json", function(data) {
        console.log(data);
        node_link_data = data;
        var n = data.nodes.length;

        force.nodes(data.nodes).links(data.links);

        // Initialize the positions deterministically, for better results.
        data.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

        // Run the layout a fixed number of times.
        // The ideal number of times scales with graph complexity.
        // Of course, don't run too long—you'll hang the page!
        force.start();
        for (var i = n; i > 0; --i){
           force.tick();
           console.log(i);
        }
        force.stop();

        // Center the nodes in the middle.
        var ox = 0, oy = 0;
        data.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
        ox = ox / n - width / 2, oy = oy / n - height / 2;
        data.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });

        var link = svg.selectAll(".link")
            .data(data.links)
          .enter().append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .attr("opacity",OPACITY.link)
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        var node = svg.selectAll(".node")
            .data(data.nodes)
          .enter().append("circle")
            .attr("class", "node")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 4.5)
            .attr("opacity",OPACITY.node)
            .style("fill", function(d) { return color(regions.indexOf(d.region) + 1); })
            // .call(force.drag);
            .on("mouseover",function(d){
                // console.log(d);
                if (d3.select(this).attr('opacity') == OPACITY.node) {
                    show(data_dict,d.name);
                }
                nei = d.neighbors;
                nei.push(d.name);
                svg.selectAll(".node")
                    .attr("opacity",function(dd){
                        if (d3.select(this).attr('opacity') != OPACITY.node) {
                            return d3.select(this).attr('opacity');
                        }
                        else if (nei.indexOf(dd.name) != -1) {
                            return OPACITY.node;
                        }
                        else {
                            return OPACITY.node / 4;
                        }
                    })
                
                svg.selectAll(".link")
                    .style("stroke", e => e.source.name == d.name || e.target.name == d.name? "red": "#999")
                    .style("stroke-width", e => e.source.name == d.name || e.target.name == d.name? 3: 1.5);
                svg.selectAll(".link")
                    .sort((a, b) => (a.source.name == d.name || a.target.name == d.name) - (b.source.name == d.name || b.target.name == d.name));
              // console.log(d);
              
            })
            .on("mouseout",function(){
            //   unshow();
                svg.selectAll(".node")
                    .attr("opacity",function(dd){
                        if (d3.select(this).attr('opacity') == OPACITY.node / 4) {
                            return OPACITY.node;
                        }
                        else{
                            return d3.select(this).attr('opacity');
                        }
                    })
                svg.selectAll(".link")
                    .style("stroke", "#999")
                    .style("stroke-width", 1.5);
            })


        // svg.on("mousemove", function() {
        //   fisheye.focus(d3.mouse(this));

        //   node.each(function(d) { d.fisheye = fisheye(d); })
        //       .attr("cx", function(d) { return d.fisheye.x; })
        //       .attr("cy", function(d) { return d.fisheye.y; })
        //       .attr("r", function(d) { return d.fisheye.z * 4.5; });

        //   link.attr("x1", function(d) { return d.source.fisheye.x; })
        //       .attr("y1", function(d) { return d.source.fisheye.y; })
        //       .attr("x2", function(d) { return d.target.fisheye.x; })
        //       .attr("y2", function(d) { return d.target.fisheye.y; });
        // });
      });
}
chart1();

function changeShow(select = 'world'){
    if (select == 'USA') {
        select = 'none';
    }
    northamerica_list = ['none','canada'];

    var svg = d3.select("#chart1").select("svg");
    var node = svg.selectAll(".node")
                .attr("opacity",function(d){
                    if (select == 'world') {
                            return OPACITY.node;
                    }
                    else if (select == 'northamerica') {
                        if (northamerica_list.indexOf(d.region) != -1) {
                            return OPACITY.node;
                        }
                        else {
                            return 0;
                        }

                    }
                    else{
                        if (d.region == select) {
                            return OPACITY.node;
                        }
                        else {
                            return 0;
                        }
                    }
                    // console.log(d);

                });
    var link = svg.selectAll(".link")
                .attr("opacity",function(d){
                    if (select == 'world') {
                        return OPACITY.link;
                    }
                    else if (select == 'northamerica') {
                        if (northamerica_list.indexOf(d.source.region) != -1 && northamerica_list.indexOf(d.target.region) != -1) {
                            return OPACITY.link;
                        }
                        else {
                            return 0;
                        }

                    }
                    else{
                    if (d.source.region == select && d.target.region == select) {
                        return OPACITY.link;
                    }
                    else {
                        return 0;
                    }
                    }

                });

}