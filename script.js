const PlotSample = 7;
const DataSource = 'https://raw.githubusercontent.com/sunmoonStern/funin-open-data/main/hospital-data-address.tsv'
const NameMap = {
   'et_count': '移植数',
   'preg_count': '妊娠数',
   'birth_count': '分娩数',
   'birth_ratio': '分娩率'
};

const DefaultSorter = 'et_count';

let activeSorter = null;

$(document).ready(function () {
   d3.text(DataSource)
      .then(d3.tsvParseRows)
      .then(tabulate)
      .then(readyUpdate)
      .then(updateSwitcher)
      .then(updateSorter)
      .then(selectInitialGraphData)
      .then(reloadCharts);
});

let filters = [];

function updateSwitcher() {
   let categories = getDataCategories();
   categories = categories.filter((data) => {
      return data != NameMap['birth_count'];
   });

   const switcher = d3.select("#switcher")
      .selectAll("div")
      .data(categories)
      .enter()
      .append("div")
      .attr("class", "form-check form-check-inline");

   filters=[...categories];
   switcher.append("input")
      .attr("type", "checkbox")
      .attr("checked", true)
      .attr("class", "form-check-input")
      .attr("id", (_, i) => 'check-box-' + i)
      .attr("value", (d) => d)
      .on("change", function(_, d) {
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

   switcher.append("label")
      .attr("class", "form-check-label")
      .attr("for", (_, i) => 'check-box-' + i)
      .text((d) => d);

}

function updateSorter() {
   let categories = getDataCategories();
   d3.select("#sorter")
      .selectAll("input")
      .data(categories)
      .enter()
      .append("input")
      .attr("type", "button")
      .attr("class", "btn btn-outline-secondary btn-sm")
      .attr("value", (d) => d)
      .on("click", function (d) {
         if (activeSorter) {
            activeSorter.classed("btn-primary", false).classed("btn-outline-secondary", true);
         }
         activeSorter = d3.select(this);
         activeSorter.classed("btn-outline-secondary", false).classed("btn-primary", true);

         let sorter = d.target.value;
         let index = categories.indexOf(sorter) + 1;
         var api = $("#data").dataTable().api();
         api.column(index).order('desc').draw();
         reloadCharts();
      });
}

function selectInitialGraphData() {
   let categories = getDataCategories();
   let index = categories.indexOf(NameMap[DefaultSorter]) + 1;
   var api = $("#data").dataTable().api();
   api.column(index).order('desc').draw();
   api.rows({page:'current'}).select().draw();

   d3.select('input.btn.btn-sm[value="'+NameMap[DefaultSorter]+'"]')
      .classed('btn-outline-secondary', false)
      .classed('btn-primary', true);
}

function readyUpdate() {
   const table = $("#data").DataTable({
      dom: "Bfrtip",
      select: {
         style: "multi"
      },
      language: {
         search: "クリニック名や住所で検索→"
      },
      buttons: [
         {
            text: "グラフ更新",
            action: function () {
               reloadCharts();
            }
         },
         {
            text: "選択解除",
            action: function () {
               table.rows({ selected: true }).deselect();
               reloadCharts();
            }
         }
      ]
   });
}

function reloadCharts() {
   const hospitalNames = getHospitalNames().slice(0, PlotSample);

   const etCount = getEtCount().slice(0, PlotSample);
   const pregCount = getPregCount().slice(0, PlotSample);
   const birthRate = getBirthRate().slice(0, PlotSample);
   updateCharts(hospitalNames, etCount, pregCount, birthRate);
}

function getDataCategories() {
   var categories = [];
   var api = $("#data").dataTable().api();

   var headers = api.columns().header().toArray();
   headers.forEach(function(heading, index) {
      if (index > 0 && index < headers.length - 1) {
         categories.push($(heading).html());
      }
   });

   return categories;
}

function getHospitalNames() {
   // table.rows( { selected: true } );

   var names = [];
   var api = $("#data").dataTable().api();

   let rows = api.rows({ selected: true }).data().toArray();

   rows.forEach(function (row) {
      names.push(row[0]);
   });
   return names;
}

function getEtCount() {
   var stats = [];
   var api = $("#data").dataTable().api();

   let rows = api.rows({ selected: true }).data().toArray();

   rows.forEach(function (row) {
      stats.push(parseInt(row[1]));
   });
   return stats;
}

function getPregCount() {
   var stats = [];
   var api = $("#data").dataTable().api();

   let rows = api.rows({ selected: true }).data().toArray();

   rows.forEach(function (row) {
      stats.push(parseInt(row[2]));
   });
   return stats;
}

function getBirthRate() {
   var stats = [];
   var api = $("#data").dataTable().api();

   let rows = api.rows({ selected: true }).data().toArray();

   rows.forEach(function (row) {
      stats.push(parseFloat(row[4]));
   });
   return stats;
}

function updateCharts(hospitalNames, etCount, pregCount, birthRate) {
   let series = [
      {
         name: NameMap["et_count"],
         data: etCount
      },
      {
         name: NameMap["preg_count"],
         data: pregCount
      },
      {
         name: NameMap["birth_ratio"],
         data: birthRate
      }
   ];

   series = series.filter((data) => {
      return filters.includes(data.name);
   });

   const chart = Highcharts.chart("container", {
      chart: {
         type: "column"
      },
      title: {
         text: "",
         align: "left"
      },
      xAxis: {
         categories: hospitalNames,
         crosshair: true,
         // labels: {
         //    overflow: 'allow',
         //    rotation: -80,
         //    style: {
         //       textOverflow: 'none' // 省略マーク(...)を表示しない
         //    }
         // }
      },
      yAxis: { // 通常のyAxis設定
         title: {
            text: ''
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
      .attr('nowrap', 'nowrap')
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

