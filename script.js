let draw = false;
const plotSample = 7;
const dataSource = 'https://raw.githubusercontent.com/sunmoonStern/funin-open-data/main/hospital-data-address.tsv'
const nameMap = {
   'et_count': '移植数',
   'preg_count': '妊娠数',
   'birth_count': '分娩数',
   'birth_ratio': '分娩率'
};

$(document).ready(function () {
  d3.text(dataSource)
    .then(d3.tsvParseRows)
    .then(tabulate)
    .then(readyUpdate)
    .then(updateSwitcher)
    .then(updateSorter)
    .then(visibleInitialGraphs)
    .then(reloadCharts);
});

let filters = [];

function updateSwitcher() {
   let categories = getDataCategories();
   categories = categories.filter((data) => {
      return data != nameMap['birth_count'];
      });

   const switcher = d3.select("#switcher")
      .selectAll("div")
      .data(categories)
      .enter()
      .append("label");

   filters=[...categories];
   switcher.append("input")
      .attr("type", "checkbox")
      .attr("checked", true)
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

   switcher.append("span")
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
   .attr("value", (d) => d)
   .on("click", (d) => {
      let sorter = d.target.value;
      let index = categories.indexOf(sorter) + 1;
      var api = $("#data").dataTable().api();
      api.column(index).order('desc').draw();
      reloadCharts();
   });
}

function visibleInitialGraphs() {
   let categories = getDataCategories();
   let index = categories.indexOf('birth_ratio') + 1;
   var api = $("#data").dataTable().api();
   api.column(index).order('desc').draw(); api.rows({page:'current'}).select().draw();
   reloadCharts();
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
  const hospitalNames = getHospitalNames().slice(0, plotSample);

  const etCount = getEtCount().slice(0, plotSample);
  const pregCount = getPregCount().slice(0, plotSample);
  const birthRate = getBirthRate().slice(0, plotSample);
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
         name: nameMap["et_count"],
         data: etCount
      },
      {
         name: nameMap["preg_count"],
         data: pregCount
      },
      {
         name: nameMap["birth_ratio"],
         data: birthRate
      }
   ];

   series = series.filter((data) => {
      return filters.includes(data.name);
   });
   console.log(filters);

   const chart = Highcharts.chart("container", {
      chart: {
         type: "column"
      },
      title: {
         text: "",
         align: "left"
      },
      xAxis: { // カテゴリーをここに
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
    .text((d) => nameMap[d]);

  const rows = tbody.selectAll(null).data(data).enter().append("tr");

  rows
    .selectAll(null)
    .data((d) => d)
    .enter()
    .append("td")
    .text((d) => d);

  return table;
}

