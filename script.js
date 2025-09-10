document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const nav = document.getElementById('primary-navigation');

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', (e) => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    })
  );
});

function agregarInterpretacion(idContenedor, texto) {
  const contenedor = document.getElementById(idContenedor).parentNode;
  let p = contenedor.querySelector(".chart-desc");
  if (!p) {
    p = document.createElement("p");
    p.className = "chart-desc";
    contenedor.appendChild(p);
  }
  p.textContent = texto;
}

function actualizarExplicacion(titulo, texto) {
  document.getElementById("chartTitle").textContent = titulo;
  document.querySelector("#chartExplanation p").textContent = texto;
}

function crearGrafico(tipo) {
  let config;
  if(tipo === 'edad') {
    config = {
      type: 'bar',
      data: { labels: labelsEdad, datasets:[{
        label:'Nacimientos',
        data: valoresEdad,
        backgroundColor:'#FF9F40',
        borderColor:'#FF9F40',
        borderWidth:1,
        hoverBackgroundColor:'#FFA366'
      }]},
      options: {
        responsive:true,
        maintainAspectRatio:false,
        animation: { duration:800, easing:'easeOutQuart' },
        scales: {
          x: { 
            ticks: {
              align:'center',
              crossAlign:'center',
              maxRotation:0,
              minRotation:0
            }
          },
          y: { beginAtZero:true }
        },
        plugins: { legend:{ display:false } }
      }
    };

    actualizarExplicacion(
      "Distribución por edad de la madre",
      "La mayoría de nacimientos se concentran entre los 20 y 25 años, lo que refleja el rango de mayor fecundidad en Pereira en 2020."
    );

  } else {
    config = {
      type:'bar',
      data:{ labels:regimenes, datasets:datasetsSexoRegimen },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        animation: { duration:800, easing:'easeOutQuart' },
        plugins:{ tooltip:{ mode:'index', intersect:false } },
        scales:{ x:{ stacked:true }, y:{ stacked:true, beginAtZero:true } }
      }
    };

    actualizarExplicacion(
      "Distribución de sexo según régimen de salud",
      "Se observa que los nacimientos están mayormente asociados al régimen contributivo, con predominio en ambos sexos."
    );
  }

  if(chart) {
    chart.config.type = config.type;
    chart.data = config.data;
    chart.options = config.options;
    chart.update();
  } else {
    chart = new Chart(ctx, config);
  }
}

d3.dsv(";", "nacimientos_pereira2020_1.csv").then(data => {
  data.forEach(d => {
    d.Sexo = (d["Sexo"] || "").trim().toUpperCase();
    d.Zona = (d["Zona (U=urbana; R=rural)"] || "").trim().toUpperCase();
    d.Regimen = (d["Regimen Salud"] || "").trim().toUpperCase();
  });

  // ===== Sexo =====
  let conteoSexo = d3.rollup(data, v => v.length, d => d.Sexo);
  let labelsSexo = Array.from(conteoSexo.keys());
  let valoresSexo = Array.from(conteoSexo.values());

  new Chart(document.getElementById('sexoChart').getContext('2d'), {
    type: 'pie',
    data: { 
      labels: labelsSexo, 
      datasets:[{ 
        data: valoresSexo, 
        backgroundColor: ['#36A2EB','#FF6384'] 
      }] 
    },
    options: { 
      responsive:true, 
      plugins:{ legend:{ position:'bottom' } } 
    }
  });

  let mayorSexo = labelsSexo[valoresSexo.indexOf(Math.max(...valoresSexo))];
  agregarInterpretacion("sexoChart", `La mayoría de nacimientos fueron de sexo ${mayorSexo.toLowerCase()}.`);

  // ===== Zona =====
  let zonasFiltradas = data.filter(d =>
    ["CABECERA MUNICIPAL","RURAL DISPERSO","CENTRO POBLADO (INSPECCIÓN, CORREGIMIENTO O CASERÍO)"].includes(d.Zona)
  );
  let conteoZona = d3.rollup(zonasFiltradas, v => v.length, d => d.Zona);
  let labelsZona = Array.from(conteoZona.keys());
  let valoresZona = Array.from(conteoZona.values());

  new Chart(document.getElementById('zonaChart').getContext('2d'), {
    type: 'bar',
    data: { 
      labels: labelsZona, 
      datasets:[{ 
        label:'Nacimientos', 
        data: valoresZona, 
        backgroundColor:['#4BC0C0','#FF9F40','#9966FF'] 
      }] 
    },
    options: { 
      responsive:true, 
      maintainAspectRatio:false, 
      scales:{ 
        x:{ 
          ticks:{ 
            autoSkip: false,
            callback: function(value, index) {
              let label = this.getLabelForValue(value);
              return label.length > 12 
                ? label.match(/.{1,12}/g)
                : label;
            }
          }
        }, 
        y:{ beginAtZero:true } 
      }, 
      plugins:{ legend:{ display:false } } 
    }
  });

  let mayorZona = labelsZona[valoresZona.indexOf(Math.max(...valoresZona))];
  agregarInterpretacion("zonaChart", `La mayor concentración de nacimientos ocurrió en la ${mayorZona.toLowerCase()}.`);

  // ===== Régimen de salud =====
  let conteoRegimen = d3.rollup(data, v => v.length, d => d.Regimen);
  let labelsRegimen = Array.from(conteoRegimen.keys());
  let valoresRegimen = Array.from(conteoRegimen.values());

  new Chart(document.getElementById('regimenChart').getContext('2d'), {
    type: 'doughnut',
    data: { 
      labels: labelsRegimen, 
      datasets:[{ 
        data: valoresRegimen, 
        backgroundColor:['#FFCE56','#36A2EB','#FF6384','#4BC0C0'] 
      }] 
    },
    options: { 
      responsive:true, 
      plugins:{ legend:{ position:'bottom' } } 
    }
  });

  let mayorRegimen = labelsRegimen[valoresRegimen.indexOf(Math.max(...valoresRegimen))];
  agregarInterpretacion("regimenChart", `Predomina el régimen de salud ${mayorRegimen.toLowerCase()}.`);
});