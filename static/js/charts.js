var classe = 1;
var cidade = 1;

$('#cidade').change(function() {
	cidade = $('#cidade').val();
	montaGraficos(cidade, classe)
});

$('#classe').change(function() {
	classe = $('#classe').val();
	montaGraficos(cidade, classe)
});

montaGraficos(cidade, classe)

function montaGraficos(cidade, classe){
	//var url = "/checkins/?classe=1&cidade=2";
	var url = "/checkins/?classe=" + classe + "&cidade=" + cidade;
	console.log(classe, cidade);

	d3.json(url, function(error, checkinsJson) {

		var checkins = checkinsJson["items"];
		var dateFormat = d3.time.format("%Y-%m-%d");
		var dias = ['', 'Segunda','Terça','Quarta','Quinta','Sexta','Sábado', 'Domingo'];

		checkins.forEach(function(d) {
			var data_temporaria = dateFormat.parse(d["data"])
			d["dia"] = data_temporaria.getDay()
			if(data_temporaria.getDay() == 0){//necessario para que o domingo fique proximo ao final de semana
				d["dia"] = 7
			}
			d["total"] = +d["total"];
		});

		var ndx = crossfilter(checkins);//instancia do crossfilter

		var dataDim = ndx.dimension(function(d) { return d["data"]; });
		var diaDim = ndx.dimension(function(d) { return d["dia"]; });
		var horarioDim = ndx.dimension(function(d) { return d["horario"]; });
		var categoriaMaeDim = ndx.dimension(function(d) { return d["categoria_mae"]; });
		var localDim = ndx.dimension(function(d) { return d["nome"]; });

		var groupedDimension = localDim.group().reduce(
          function (p, v) {//adiciona
              ++p.contador;
              p.key
              p.categoria = v.categoria;
              p.razao = v.razao;
              p.likes = v.likes;
              p.lat = v.lat;
              p.long = v.long;
              return p;
          },
          function (p, v) {//remove
              --p.contador;
              p.categoria = v.categoria;
              p.razao = v.razao;
              p.likes = v.likes;
              p.lat = v.lat;
              p.long = v.long;
              return p;
          },
          function () {//inicia
              return {contador: 0}
      		});

		var precoDim = ndx.dimension(function(d) {
			var preco = d["preco"];
			 if (preco == 1) {
	            return '1';
	        } else if (preco == 2) {
	            return '2';
	        } else if (preco == 3) {
	            return '3';
	        } else if (preco == 4) {
	            return '4';
	        } else {
	        	return 'Sem preço';
	        }

		});

		var todos = ndx.groupAll();
		var numCheckinsPorDia = diaDim.group();
		var numCheckinsPorHorario = horarioDim.group();
		var numCheckinsPorCategoria = categoriaMaeDim.group();

		var totalCheckinsPorCategoriaMae = categoriaMaeDim.group().reduceSum(function(d) { return d["total"]; });
		var totalCheckins = ndx.groupAll().reduceSum(function(d) {return d["total"];});
		var numCheckinsPorPreco = precoDim.group();

		var cores_legenda = ["#ff0081", "#a2d10c", "#fbbd2c", "#0051ff", "#bab5b5"];
		var cores_legenda_dicionario = {"1": "#ff0081", "2": "#a2d10c", "3": "#fbbd2c", "4": "#0051ff", "Sem preço": "#bab5b5"}

		legenda(numCheckinsPorPreco, cores_legenda_dicionario);

		var minHorario = horarioDim.bottom(1)[0]["horario"];
		var maxHorario = horarioDim.top(1)[0]["horario"];

		var horarioChart = dc.barChart("#horario-chart");
		var categoriaMaeChart = dc.rowChart("#categoria-mae-chart");
		var diaChart = dc.rowChart("#dia-chart");
		var totalCheckinsND = dc.numberDisplay("#numero-checkins-nd");
		var precosChart = dc.pieChart('#precos-chart');
		var rankingLocaisDataTable = dc.dataTable("#data-table-ranking");
		var cores = ["#ff7373", "#fbbd2c", "#20e0e5", "#a2d10c", "#ff0081", "#0051ff", "#bab5b5", "#eca73b", "#3279d3", "#d08cf6"];

		totalCheckinsND
			.height(100)
			.formatNumber(d3.format("d"))
			.valueAccessor(function(d){return d; })
			.group(todos);

		horarioChart
			.width(600)
			.height(160)
			.margins({top: 10, right: 50, bottom: 30, left: 50})
			.dimension(horarioDim)
			.group(numCheckinsPorHorario)
			.transitionDuration(500)
			.elasticY(true)
			.xAxisLabel("Hora do dia")
			.x(d3.scale.linear().domain([minHorario, maxHorario]))
			.yAxisLabel("Qtd de check-ins");

		categoriaMaeChart
			.width(300)
			.height(250)
			.dimension(categoriaMaeDim)
			.group(numCheckinsPorCategoria)
			.colors(cores)
			.xAxis().ticks(4);

		diaChart
			.width(300)
			.height(250)
			.dimension(diaDim)
			.group(numCheckinsPorDia)
			.label(function(d){	return dias[d.key] })
			.elasticX(true)
			.colors(cores);

		precosChart
		 	.width(280)
	        .height(180)
	        .radius(80)
	        .innerRadius(30)
	        .dimension(precoDim)
	        .group(numCheckinsPorPreco)
	        .colors(cores_legenda)
			.label(function (d) {
				if (precosChart.hasFilter() && !precosChart.hasFilter(d.key))
					return "0.0%";
				return (d.value / todos.value() * 100).toFixed(1) + "%";
	        });

		rankingLocaisDataTable
			.width(800)
			.height(800)
			.dimension(groupedDimension)
			.group(function(d) {return ("<b>" + d.value.razao + "</b>");})
			.size(100)
			.columns([
				function(d) { return d.key; },
			    function(d) { return d.value.categoria; },
			    function(d) { return d.value.contador; },
			    function(d) { return d.value.likes; },
			    function(d) { return '<a href=\"http://maps.google.com/maps?z=12&t=m&q=loc:' + d.value.lat + '+' + d.value.long +"\" target=\"_blank\">Mapa</a>"}
			])
			.sortBy(function(d){ return  (-1 * d.value.contador); })
			.order(d3.descending);

		var usuarioDim = ndx.dimension(function(d) { return d["usuario"]; });
		var numCheckinsPorUsuario = usuarioDim.group();
		var dadosDistribuicao = distribuicao(numCheckinsPorUsuario);

		dc.renderAll();

		histograma(dadosDistribuicao[0], dadosDistribuicao[2]);

	});
}

function legenda(filter, cores_legenda){
	var total = 0;
	var f = eval(filter);
	if (typeof(f.length) != "undefined") {}else{}
	if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
	if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}

	$("#precos-legenda").empty();

	f.forEach(function(item) {total = total + item.value;});

	f.forEach(function(item) {
    	$("#precos-legenda").append("<div id=" + item.key + " class='elemento-legenda'><div class='quadradinho' style='background: " + cores_legenda[item.key] + "'></div> <div class='texto-legenda'>" + item.key + "\t\t\t (" + (item.value / total * 100).toFixed(1) + "%) " + "</div></div>");

	});
}

function print_filter(filter){
	var f = eval(filter);
	if (typeof(f.length) != "undefined") {}else{}
	if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
	if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
	console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));

}

function distribuicao(dados){
	var f = eval(dados);
	if (typeof(f.length) != "undefined") {}else{}
	if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
	if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
	var distribuicao = [], min = 0, max = 0, contador = 0;

	f.forEach(function(item) {
		distribuicao.push(item.value);

		if (item.value > max) {
			max = item.value;
		}else{
			if(item.value < min){
				min = item.value;
			}
		}

	});

	return ([distribuicao, min, max]);
}

function histograma(values, max){
	$("#distribuicao-chart").empty();
	console.log(max);

	var formatCount = d3.format(",.0f");
	var margin = {top: 10, right: 30, bottom: 30, left: 30},
	    width = 500 - margin.left - margin.right,
	    height = 300 - margin.top - margin.bottom;

	var x = d3.scale.linear()
	    .domain([0, max])
	    .range([0, width]);

	// Generate a histogram using twenty uniformly-spaced bins.
	var data = d3.layout.histogram()
	    .bins(x.ticks(20))
	    (values);

	var y = d3.scale.linear()
	    .domain([0, d3.max(data, function(d) { return d.y; })])
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var svg = d3.select("#distribuicao-chart").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var bar = svg.selectAll(".bar")
	    .data(data)
	  	.enter().append("g")
	    .attr("class", "bar")
	    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", x(data[0].dx) - 1)
	    .attr("height", function(d) { return height - y(d.y); });

	bar.append("text")
	    .attr("dy", ".75em")
	    .attr("y", 6)
	    .attr("x", x(data[0].dx) / 2)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return formatCount(d.y); });

	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

}

//# sourceMappingURL=dc.js.map
