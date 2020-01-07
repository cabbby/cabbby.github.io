let data_dict;
function show_info(data_dict, iter = 'Peking University', c_fac){
    d3.select('.rightBar').classed('rightBar-moved', true);
    d3.select('#bar_image1').attr('src', data_dict[iter].pic[0])
    // d3.select('#bar_image2').attr('src', data_dict[iter].pic[1])
    
    d3.select("#t1").html("Homepage");
    d3.select("#t2").html("Info");

    // 这里调取了图片
    document.getElementById('bar_name').innerHTML = iter;
    document.getElementById('bar_homepage').innerHTML = `<a href="${data_dict[iter].homepage}" target="_blank">${data_dict[iter].homepage}</a>`;
    document.getElementById('bar_region').innerHTML = `<div style="padding-top: 5px">Region: ${data_dict[iter].region}</div><div style="padding-top: 5px">Faculties: ${c_fac}</div>`;
    d3.select(".img").style("visibility", "visible");
}

function show_info_fac(fac, institution, area_det) {

    d3.select("#t1").html("Institution");
    d3.select("#t2").html("Publication");

    document.getElementById('bar_name').innerHTML = fac;
    document.getElementById('bar_homepage').innerHTML = institution;
    document.getElementById('bar_region').innerHTML = area_det.map(d => `<div style="padding-top: 5px">${d[0]} : ${d[1]}</div>`).reduce((a, b) => a + b);
    d3.select(".img").style("visibility", "hidden");

}

function unshow()
{
    d3.select('.rightBar').classed('rightBar-moved', false);
}
// main()


function init_data(origin_data){
    data_dict = {}

    for (var i = origin_data.length - 1; i >= 0; i--) {
        data_dict[origin_data[i].institution] = {'region':origin_data[i].region,'homepage':origin_data[i].homepage,'pic':origin_data[i].pic}
    }
    return data_dict;
}
d3.json('data/institution_info.json').then(function(data){
    // console.log(data);
    data_dict = init_data(data);

    //show_info(data_dict);
    // unshow();

})




