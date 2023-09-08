const PlotSample = 100;
const DataSource =
"https://raw.githubusercontent.com/code-for-future-moms/fetch-open-data/main/data/hospital-data-address-R40620.tsv";
const NameMap = {
	et_count: "移植数",
	preg_count: "妊娠数",
	birth_count: "生産分娩数",
	birth_ratio: "生産分娩率",
};

const DefaultSorter = "et_count";

let activeRatioChartSorter = null;
let activeCountChartSorter = null;

$(document).ready(function () {
	d3.text(DataSource)
		.then(d3.tsvParseRows)
		.then(tabulate)
		.then(readyUpdate)
		.then(updateRatioChartSorter)
		.then(updateCountChartSwitcher)
		.then(updateCountChartSorter)
		.then(selectInitialGraphData)
		.then(reloadCharts);
});

let filters = [];

function updateRatioChartSorter() {
	const categories = getDataCategories().filter(
		(data) => data === NameMap.birth_ratio,
	);
	d3.select("#ratio-chart-sorter")
		.selectAll("input")
		.data(categories)
		.enter()
		.append("input")
		.attr("type", "button")
		.attr("class", "btn btn-outline-secondary btn-sm")
		.attr("value", (d) => d)
		.on("click", function (d) {
			if (activeRatioChartSorter) {
				activeRatioChartSorter
					.classed("btn-primary", false)
					.classed("btn-outline-secondary", true);
			}
			activeRatioChartSorter = d3.select(this);
			activeRatioChartSorter
				.classed("btn-outline-secondary", false)
				.classed("btn-primary", true);

			const sorter = d.target.value;
			const index = categories.indexOf(sorter) + 1;
			const api = $("#data").dataTable().api();
			api.column(index).order("desc").draw();
			reloadCharts();
		});
}

function updateCountChartSwitcher() {
	let categories = getDataCategories();
	categories = categories.filter((data) => {
		return data !== NameMap.birth_ratio;
	});

	const switcher = d3
		.select("#count-chart-switcher")
		.selectAll("div")
		.data(categories)
		.enter()
		.append("div")
		.attr("class", "form-check form-check-inline");

	filters = [...categories];
	switcher
		.append("input")
		.attr("type", "checkbox")
		.attr("checked", true)
		.attr("class", "form-check-input")
		.attr("id", (_, i) => `check-box-${i}`)
		.attr("value", (d) => d)
		.on("change", function (_, d) {
			if (this.checked) {
				filters.push(d);
			} else {
				const index = filters.indexOf(d);
				if (index > -1) {
					filters.splice(index, 1);
				}
			}
			reloadCharts();
		});

	switcher
		.append("label")
		.attr("class", "form-check-label")
		.attr("for", (_, i) => `check-box-${i}`)
		.text((d) => d);
}

function updateCountChartSorter() {
	const categories = getDataCategories();
	d3.select("#count-chart-sorter")
		.selectAll("input")
		.data(categories)
		.enter()
		.append("input")
		.attr("type", "button")
		.attr("class", "btn btn-outline-secondary btn-sm")
		.attr("value", (d) => d)
		.on("click", function (d) {
			if (activeCountChartSorter) {
				activeCountChartSorter
					.classed("btn-primary", false)
					.classed("btn-outline-secondary", true);
			}
			activeCountChartSorter = d3.select(this);
			activeCountChartSorter
				.classed("btn-outline-secondary", false)
				.classed("btn-primary", true);

			const sorter = d.target.value;
			const index = categories.indexOf(sorter) + 1;
			const api = $("#data").dataTable().api();
			api.column(index).order("desc").draw();
			reloadCharts();
		});
}

function selectInitialGraphData() {
	const categories = getDataCategories();
	const index = categories.indexOf(NameMap[DefaultSorter]) + 1;
	const api = $("#data").dataTable().api();
	api.column(index).order("desc").draw();
	api.rows({ page: "current" }).select().draw();

	d3.select(`input.btn.btn-sm[value="${NameMap[DefaultSorter]}"]`)
		.classed("btn-outline-secondary", false)
		.classed("btn-primary", true);
}

function readyUpdate() {
	const table = $("#data").DataTable({
		dom: "Bfrtip",
		select: {
			style: "multi",
		},
		language: {
			search: "クリニック名や住所で検索→",
		},
		info: false,
		buttons: [
			{
				text: "グラフ更新",
				action: function () {
					reloadCharts();
				},
			},
			{
				text: "選択解除",
				action: function () {
					table.rows({ selected: true }).deselect();
					reloadCharts();
				},
			},
		],
	});
}

function reloadCharts() {
	const hospitalNames = getHospitalNames().slice(0, PlotSample);

	const etCount = getEtCount().slice(0, PlotSample);
	const pregCount = getPregCount().slice(0, PlotSample);
	const birthCount = getBirthCount().slice(0, PlotSample);
	const birthRate = getBirthRate().slice(0, PlotSample);
	updateCharts(hospitalNames, etCount, pregCount, birthCount, birthRate);
}

function getDataCategories() {
	const categories = [];
	const api = $("#data").dataTable().api();

	const headers = api.columns().header().toArray();
	headers.forEach(function (heading, index) {
		if (index > 0 && index < headers.length - 1) {
			categories.push($(heading).html());
		}
	});

	console.log(categories);
	return categories;
}

function getHospitalNames() {
	const names = [];
	const api = $("#data").dataTable().api();

	const rows = api.rows().data().toArray();

	rows.forEach(function (row) {
		names.push(row[0]);
	});
	return names;
}

function getEtCount() {
	const stats = [];
	const api = $("#data").dataTable().api();

	const rows = api.rows().data().toArray();

	rows.forEach(function (row) {
		stats.push(parseInt(row[1]));
	});
	return stats;
}

function getPregCount() {
	const stats = [];
	const api = $("#data").dataTable().api();

	const rows = api.rows().data().toArray();

	rows.forEach(function (row) {
		stats.push(parseInt(row[2]));
	});
	return stats;
}

function getBirthCount() {
	const stats = [];
	const api = $("#data").dataTable().api();

	const rows = api.rows().data().toArray();

	rows.forEach(function (row) {
		stats.push(parseFloat(row[3]));
	});
	return stats;
}

function getBirthRate() {
	const stats = [];
	const api = $("#data").dataTable().api();

	const rows = api.rows().data().toArray();

	rows.forEach(function (row) {
		stats.push(parseFloat(row[4]));
	});
	return stats;
}

function updateCharts(
	hospitalNames,
	etCount,
	pregCount,
	birthCount,
	birthRate,
) {
	updateRatioChart(hospitalNames, birthRate);
	updateCountChart(hospitalNames, etCount, pregCount, birthCount);
}

function updateRatioChart(hospitalNames, birthRate) {
	const series = [
		{
			name: NameMap.birth_ratio,
			data: birthRate,
		},
	];

	Highcharts.chart("ratio-chart-container", {
		chart: {
			type: "column",
		},
		title: {
			text: "",
			align: "left",
		},
		xAxis: {
			categories: hospitalNames,
			crosshair: true,
			labels: {
				align: "left",
				distance: 0,
				allowOverlap: true,
				step: 1,
				style: {
					fontSize: "9px",
					textOverflow: "none",
					writingMode: "vertical-rl",
				},
			},
		},
		yAxis: {
			title: {
				text: "",
			},
		},
		colors: ["#F677AD"],
		plotOptions: {
			series: {
				pointPadding: 0.01,
			},
		},
		series: series,
	});
}

function updateCountChart(hospitalNames, etCount, pregCount, birthCount) {
	let series = [
		{
			name: NameMap.et_count,
			data: etCount,
		},
		{
			name: NameMap.preg_count,
			data: pregCount,
		},
		{
			name: NameMap.birth_count,
			data: birthCount,
		},
	];

	series = series.filter((data) => {
		return filters.includes(data.name);
	});

	Highcharts.chart("count-chart-container", {
		chart: {
			type: "column",
		},
		title: {
			text: "",
			align: "left",
		},
		xAxis: {
			categories: hospitalNames,
			crosshair: true,
			labels: {
				align: "left",
				distance: 0,
				allowOverlap: true,
				step: 1,
				style: {
					fontSize: "9px",
					textOverflow: "none",
					writingMode: "vertical-rl",
				},
			},
		},
		yAxis: {
			title: {
				text: "",
			},
		},
		colors: ["#2CAFFE", "#544FC5", "#6B8ABC"],
		plotOptions: {
			series: {
				pointPadding: 0.01,
			},
		},
		series: series,
	});
}

function tabulate(data) {
	const table = d3.select("table");
	const thead = table.append("thead");
	const tbody = table.append("tbody");

	thead
		.append("tr")
		.selectAll(null)
		.data(data.shift())
		.enter()
		.append("th")
		.attr("nowrap", "nowrap")
		.text((d) => NameMap[d]);

	const rows = tbody.selectAll(null).data(data).enter().append("tr");

	rows
		.selectAll(null)
		.data((d) => d)
		.enter()
		.append("td")
		.text((d) => d);

	return table;
}
