var dashboard = {

  el: {//elementos
    classe: 1,
    cidade: 2,
    classeValue: $('#classe'),
    cidadeValue: $('#cidade'),

  },

  url: "/checkins/?classe=" + classe + "&cidade=" + cidade,

  init: function() {
    dashboard.montaGraficos()
  },

  montaGraficos: function() {

  }

};

dashboard.init();
