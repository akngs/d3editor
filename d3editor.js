var DTYPES = {
    'int': {
        random: function(v) {
            var scale = v.bound[1] - v.bound[0];
            var start = v.bound[0];
            return Math.floor(Math.random() * scale + start);
        },
        render: function(v) {
            return '<input class="form-element int" type="range" data-vname="' + v.name + '" id="cfg_' + v.name + '" min="' + v.bound[0] + '" max="' + v.bound[1] + '">';
        },
        fromUI: function(v) {
            var $element = $('#cfg_' + v.name);
            var value = +$element.val();
            cfg[v.name] = value;
            $($element[0].labels[0]).find('.value').text(value);
        },
        toUI: function(v) {
            var $element = $('#cfg_' + v.name);
            var value = +cfg[v.name];
            $element.val(value);
            $($element[0].labels[0]).find('.value').text(value);
        }
    },
    'float': {
        random: function(v) {
            var scale = v.bound[1] - v.bound[0];
            var start = v.bound[0];
            return Math.floor((Math.random() * scale + start) * 100) / 100;
        },
        render: function(v) {
            return '<input class="form-element float" type="range" data-vname="' + v.name + '" id="cfg_' + v.name + '" min="' + v.bound[0] + '" max="' + v.bound[1] + '" step="0.01">';
        },
        fromUI: function(v) {
            var $element = $('#cfg_' + v.name);
            var value = +$element.val();
            cfg[v.name] = value;
            $($element[0].labels[0]).find('.value').text(value);
        },
        toUI: function(v) {
            var $element = $('#cfg_' + v.name);
            var value = +cfg[v.name];
            $element.val(value);
            $($element[0].labels[0]).find('.value').text(value);
        }
    },
    'hsla': {
        random: function(v) {
            var h = Math.floor(Math.random() * 360);
            var s = Math.round(Math.random() * 100);
            var l = Math.round(Math.random() * 100);
            var a = Math.floor(Math.random() * 100) / 100;
            return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
        },
        render: function(v) {
            return '<input class="form-element hsla" type="number" data-vname="' + v.name + '" id="cfg_' + v.name + '_h" min="0" max="360">' +
                '<input class="form-element hsla" type="number" data-vname="' + v.name + '" id="cfg_' + v.name + '_s" min="0" max="100">' +
                '<input class="form-element hsla" type="number" data-vname="' + v.name + '" id="cfg_' + v.name + '_l" min="0" max="100">' +
                '<input class="form-element hsla" type="number" data-vname="' + v.name + '" id="cfg_' + v.name + '_a" min="0" max="1" step="0.01">';
        },
        fromUI: function(v) {
            var h = +$('#cfg_' + v.name + '_h').val();
            var s = +$('#cfg_' + v.name + '_s').val();
            var l = +$('#cfg_' + v.name + '_l').val();
            var a = Math.floor(+$('#cfg_' + v.name + '_a').val() * 100) / 100;
            var value = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
            cfg[v.name] = value;
            $('label[for="cfg_' + v.name + '"] .value').text(value);
        },
        toUI: function(v) {
            var strValue = cfg[v.name];
            var parts = strValue.substring(5, strValue.length - 1).split(',');
            var h = +parts[0].trim();
            var s = +parts[1].trim().replace('%', '');
            var l = +parts[2].trim().replace('%', '');
            var a = Math.floor(+parts[3].trim() * 100) / 100;
            var value = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
            $('#cfg_' + v.name + '_h').val(h);
            $('#cfg_' + v.name + '_s').val(s);
            $('#cfg_' + v.name + '_l').val(l);
            $('#cfg_' + v.name + '_a').val(a);
            $('label[for="cfg_' + v.name + '"] .value').text(value);
        }
    }
};

var svg;
var cfg;
var updater;

function main() {
    svg = d3.select('#container  svg');
    cfg = {};

    $(window).on('resize', function() {
        fitSvgToContainer();
    });
    $('body').on('input change', '.form-element', function() {
        ui2cfg(cfg);
        triggerUpdate();
    });
    $('body').on('click', '#control .randomize-all', function(e) {
        e.preventDefault();
        var meta = cfg._meta;

        for(var i = 0; i < meta.length; i++) {
            var handler = DTYPES[meta[i].dtype];
            cfg[meta[i].name] = handler.random(meta[i]);
        }
        cfg2ui(cfg);
        update(svg, cfg);
    });
    $('body').on('click', '#control .variable .random', function(e) {
        e.preventDefault();

        var $var = $(e.currentTarget).parents('.variable');
        var handler = $var.data('handler');
        var meta = $var.data('meta');
        cfg[meta.name] = handler.random(meta);
        cfg2ui(cfg);
        update(svg, cfg);
    });
    $('#dump').on('change', function() {
        var newCfg = JSON.parse($('#dump').val());
        newCfg._meta = cfg._meta;
        cfg = newCfg;
        cfg2ui(cfg);
        update(svg, cfg);
    });

    cfg._meta = config();
    generateUI(cfg);
    cfg2ui(cfg);

    fitSvgToContainer();
    init(svg, cfg);
    update(svg, cfg);
}

function fitSvgToContainer() {
    var container = svg.node().parentNode;
    svg
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight);

    triggerUpdate();
}

function triggerUpdate() {
    if(updater) return;
    updater = window.setTimeout(function() {
        update(svg, cfg);
        updater = null;
    }, 10);
}

function generateUI(cfg) {
    var $control = $('#control');
    var meta = cfg._meta;

    for(var i = 0; i < meta.length; i++) {
        _generateSingleControl($control, cfg, meta[i]);
    }
}

function _generateSingleControl($control, cfg, v) {
    var vname = v.name;
    var dtypeHandler = DTYPES[v.dtype];

    // Assign initial value
    cfg[vname] = v.initial === undefined ? dtypeHandler.random(v) : v.initial;

    // Render UI
    var $ui = $(
        '<div class="variable" data-name="' + vname + '"><label for="cfg_' + vname + '">' +
        '   <a class="random" href="#"><i class="fa fa-random"></i></a>' +
        '   <span class="name">' + vname + '</span>' +
        '   <span class="value"></span>' +
        '</label></div>'
    );
    $ui.append(dtypeHandler.render(v));
    $ui.data('handler', dtypeHandler);
    $ui.data('meta', v);
    $control.append($ui);
}

function cfg2ui(cfg) {
    var $control = $('#control');
    var meta = cfg._meta;
    for(var i = 0; i < meta.length; i++) {
        var v = meta[i];
        var dtypeHandler = DTYPES[v.dtype];
        dtypeHandler.toUI(v);
    }

    delete cfg._meta;
    $('#dump').val(JSON.stringify(cfg));
    cfg._meta = meta;
}

function ui2cfg(cfg) {
    var meta = cfg._meta;
    for(var i = 0; i < meta.length; i++) {
        var v = meta[i];
        var dtypeHandler = DTYPES[v.dtype];
        dtypeHandler.fromUI(v);
    }

    delete cfg._meta;
    $('#dump').val(JSON.stringify(cfg));
    cfg._meta = meta;
}

$(main);
