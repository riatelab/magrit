"use strict";

class UserArrow {
    constructor(id, origin_pt, destination_pt, parent=undefined){
        this.parent = parent || svg_map;
        this.svg_elem = d3.select(this.parent);
        this.pt1 = origin_pt;
        this.pt2 = destination_pt;
        this.id = id;
        this.lineWeight = 4;
        this.color = "rgb(0, 0, 0)";

        let self = this;
        this.drag_behavior = d3.drag()
             .subject(function() {
                    let t = d3.select(this.querySelector("line"));
                    return { x: +t.attr("x2") - +t.attr("x1"),
                             y: +t.attr("y2") - +t.attr("y1"),
                             x1: t.attr("x1"), x2: t.attr("x2"),
                             y1: t.attr("y1"), y2: t.attr("y2") };
              })
            .on("start", () => {
                d3.event.sourceEvent.stopPropagation();
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", null);
              })
            .on("end", () => {
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", zoom_without_redraw);
              })
            .on("drag", function(){
                d3.event.sourceEvent.preventDefault();
                let _t = this.querySelector("line"),
                    subject = d3.event.subject,
                    tx = +d3.event.x - +subject.x,
                    ty = +d3.event.y - +subject.y;
                self.pt1 = [+subject.x1 + tx, +subject.y1 + ty];
                self.pt2 = [+subject.x2 + tx, +subject.y2 + ty];
                _t.x1.baseVal.value = self.pt1[0];
                _t.x2.baseVal.value = self.pt2[0];
                _t.y1.baseVal.value = self.pt1[1];
                _t.y2.baseVal.value = self.pt2[1];
              });

        let defs = parent.querySelector("defs"),
            markers = defs ? defs.querySelector("marker") : null;

        if(!markers){
            this.add_defs_marker();
        }
        this.draw()
    }

    add_defs_marker(){
        defs.append("marker")
            .attrs({"id":"arrow_head", "viewBox":"0 -5 10 10",
                  "refX":5, "refY":0, "orient":"auto",
                  "markerWidth":4, "markerHeight":4})
            .style("stroke-width", 1)
        	.append("path")
        	.attr("d", "M0,-5L10,0L0,5")
        	.attr("class","arrowHead");
        if(this.parent.childNodes[0].tagName != "defs"){
            this.parent.insertBefore(defs.node(), this.parent.childNodes[0]);
        }
    }

    draw(){
        let context_menu = new ContextMenu(),
            getItems = () =>  [
                {"name": i18next.t("app_page.common.edit_style"), "action": () => { this.editStyle(); }},
                {"name": i18next.t("app_page.common.up_element"), "action": () => { this.up_element(); }},
                {"name": i18next.t("app_page.common.down_element"), "action": () => { this.down_element(); }},
                {"name": i18next.t("app_page.common.delete"), "action": () => { this.arrow.remove(); }}
            ];

        this.arrow = this.svg_elem.append('g')
                .attrs({"class": "arrow legend_features legend", "id": this.id});

        this.arrow.insert("line")
        		.attrs({"class":"legend_features",
        			  "marker-end":"url(#arrow_head)",
        			  "x1": this.pt1[0], "y1": this.pt1[1],
        			  "x2":this.pt2[0], "y2": this.pt2[1]})
                .styles({"stroke-width": this.lineWeight, stroke: "rgb(0, 0, 0)"});

        this.arrow.call(this.drag_behavior);

        this.arrow.on("contextmenu dblclick", () => {
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems());
            });
    }

    up_element(){
        up_legend(this.arrow.node());
    }

    down_element(){
        down_legend(this.arrow.node());
    }

    calcAngle(){
        let dx = this.pt2[0] - this.pt1[0],
            dy = this.pt2[1] - this.pt1[1];
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    calcDestFromOAD(origin, angle, distance){
        let theta = angle / (180 / Math.PI),
            dx = distance * Math.cos(theta),
            dy = distance * Math.sin(theta);
        return [origin[0] + dx, origin[1] + dy]
    }

    editStyle(){
        let current_options = {pt1: this.pt1.slice(),
                               pt2: this.pt2.slice()};
        let self = this,
            line = self.arrow.node().querySelector("line");

        let angle = (-this.calcAngle()).toFixed(0);

        make_confirm_dialog("styleBoxArrow", i18next.t("app_page.arrow_edit_box.title"))
            .then(function(confirmed){
                if(confirmed) {
                    // Store shorcut of useful values :
                    self.lineWeight = line.style.strokeWidth;
                    self.color = line.style.stroke;
                } else {
                    //Rollback on initials parameters :
                    line.x1.baseVal.value = current_options.pt1[0];
                    line.y1.baseVal.value = current_options.pt1[1];
                    line.x2.baseVal.value = current_options.pt2[0];
                    line.y2.baseVal.value = current_options.pt2[1];
                    self.pt1 = current_options.pt1.slice();
                    self.pt2 = current_options.pt2.slice();
                    line.style.strokeWidth = self.lineWeight;
                    line.style.stroke = self.color;
                }
            });
        let box_content = d3.select(".styleBoxArrow").insert("div").attr("id", "styleBoxArrow");
        let s1 = box_content.append("p");
        s1.append("p").html(i18next.t("app_page.arrow_edit_box.arrowWeight"));
        s1.append("input")
            .attrs({type: "range", id: "arrow_lineWeight", min: 0, max: 34, step: 0.1, value: self.lineWeight})
            .styles({width: "80px", "vertical-align": "middle"})
            .on("change", function(){
                line.style.strokeWidth = this.value;
                txt_line_weight.html(this.value + "px");
            });
        let txt_line_weight = s1.append("span").html(self.lineWeight + " px");

        let s2 = box_content.append("p");
        s2.append("p").html(i18next.t("app_page.arrow_edit_box.arrowAngle"))
        s2.insert("input")
            .attrs({id: "arrow_angle", type: "range", value: angle, min: 0, max: 360, step: 1})
            .styles({width: "80px", "vertical-align": "middle"})
            .on("change", function(){
                let distance = Math.sqrt((self.pt1[0] - self.pt2[0]) * (self.pt1[0] - self.pt2[0]) + (self.pt1[1] - self.pt2[1]) * (self.pt1[1] - self.pt2[1]));
                let angle = -(+this.value);
                let [nx, ny] = self.calcDestFromOAD(self.pt1, angle, distance);
                line.x2.baseVal.value = nx;
                line.y2.baseVal.value = ny;
                document.getElementById("arrow_angle_text").value = +this.value;
            });

        s2.insert("input")
            .attrs({id: "arrow_angle_text", class: "without_spinner", value: angle, min: 0, max: 1, step: 1})
            .styles({width: "30px", "margin-left": "10px"})
            .on("input", function(){
                let elem = document.getElementById("arrow_angle");
                elem.value = this.value;
                elem.dispatchEvent(new Event('change'));
            });

        s2.insert("span").html("°");
        let s3 = box_content.append("p");
        s3.append("button")
            .attr("class", "button_st4")
            .html(i18next.t("app_page.arrow_edit_box.move_points"))
            .on("click", function(){
                let tmp_start_point = map.append("rect")
                    .attr("x", self.pt1[0] - 3)
                    .attr("y", self.pt1[1] - 3)
                    .attr("height", 6).attr("width", 6)
                    .style("fill", "red")
                    .style("cursor", "grab")
                    .call(d3.drag().on("drag", function(){
                        let t = d3.select(this);
                        let nx = d3.event.x,
                            ny = d3.event.y;
                        t.attr("x", nx).attr("y", ny);
                        line.x1.baseVal.value = nx;
                        line.y1.baseVal.value = ny;
                    }));

                let tmp_end_point = map.append("rect")
                    .attr("x", self.pt2[0] - 3)
                    .attr("y", self.pt2[1] - 3)
                    .attr("height", 6).attr("width", 6)
                    .style("fill", "red")
                    .style("cursor", "grab")
                    .call(d3.drag().on("drag", function(){
                        let t = d3.select(this);
                        let nx = d3.event.x,
                            ny = d3.event.y;
                        t.attr("x", nx).attr("y", ny);
                        line.x2.baseVal.value = nx;
                        line.y2.baseVal.value = ny;
                    }));
                let arrowDialog = $(".styleBoxArrow"),
                    original_position = arrowDialog.dialog("option", "position");
                arrowDialog.dialog("option", "position", { my: "left", at: "left", of: window });
                arrowDialog.dialog("option", "draggable", false);
                arrowDialog.hide()
                document.querySelector(".ui-widget-overlay").style.display = "none";
                let el = document.createElement("button");
                el.className = "button_st3";
                el.style = "float:right;background:forestgreen;font-size:22px;";
                el.innerHTML = i18next.t("app_page.common.done");
                el.onclick = function(){
                    document.querySelector(".ui-widget-overlay").style.display = "";
                    self.pt1 = [line.x1.baseVal.value, line.y1.baseVal.value];
                    self.pt2 = [line.x2.baseVal.value, line.y2.baseVal.value];
                    tmp_end_point.remove();
                    tmp_start_point.remove();
                    el.remove();
                    arrowDialog.show();
                    arrowDialog.dialog("option", "draggable", true);
                    arrowDialog.dialog("option", "position", original_position);
                }
                document.querySelector(".styleBoxArrow").parentElement.appendChild(el);
            });
    }
}

class Textbox {
    // woo lets use ES2015 classes !
    constructor(parent, new_id_txt_annot, position=[10, 30]){
        this.x = position[0];
        this.y = position[1];
        this.fontsize = 14;

        function end_edit_action(){
            inner_ft.attr("contentEditable", "false");
            inner_ft.style("background-color", "transparent");
            inner_ft.style("border", "");
            // Recompute the size of the p inside the foreignObj
            let inner_bbox = inner_p.getBoundingClientRect();
            foreign_obj.setAttributeNS(null, "width", [inner_bbox.width + 2, "px"].join('')); // +2px are for the border
            foreign_obj.setAttributeNS(null, "height", [inner_bbox.height + 2, "px"].join(''));
            d3.select("body").classed("noselect", false);
            state = null;
        };

        var current_timeout, state;
        let context_menu = new ContextMenu(),
            getItems = () =>  [
                {"name": i18next.t("app_page.common.edit_style"), "action": () => { this.editStyle(); }},
                {"name": i18next.t("app_page.common.up_element"), "action": () => { this.up_element(); }},
                {"name": i18next.t("app_page.common.down_element"), "action": () => { this.down_element(); }},
                {"name": i18next.t("app_page.common.delete"), "action": () => { this.text_annot.remove(); }}
            ];

        let drag_txt_annot = d3.drag()
             .subject(function() {
                    var t = d3.select(this.parentElement),
                        prev_translate = t.attr("transform");
                    prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(f => +f) : [0, 0];
                    return {
                        x: t.attr("x") - prev_translate[0],
                        y: t.attr("y") - prev_translate[1]
                    };
                })
            .on("start", () => {
                d3.event.sourceEvent.stopPropagation();
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", null);
              })
            .on("end", () => {
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", zoom_without_redraw);
              })
            .on("drag", function(){
                d3.event.sourceEvent.preventDefault();
                d3.select(this.parentElement).attr("x", d3.event.x).attr("y", d3.event.y);
              });

        let foreign_obj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreign_obj.setAttributeNS(null, "x", this.x);
        foreign_obj.setAttributeNS(null, "y", this.y);
        foreign_obj.setAttributeNS(null, "overflow", "visible");
        foreign_obj.setAttributeNS(null, "width", "100%");
        foreign_obj.setAttributeNS(null, "height", "100%");
        foreign_obj.setAttributeNS(null, "class", "legend txt_annot");
        foreign_obj.id = new_id_txt_annot;

        let inner_p = document.createElement("p");
        inner_p.setAttribute("id", "in_" + new_id_txt_annot);
        inner_p.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        inner_p.style = "display:table-cell;padding:10px;color:#000;"
            + "opacity:1;font-family:'Verdana,Geneva,sans-serif';font-size:14px;white-space: pre;"
            + "word-wrap: normal; overflow: visible; overflow-y: visible; overflow-x: visible;"
        inner_p.innerHTML = i18next.t("app_page.text_box_edit_box.constructor_default");
        foreign_obj.appendChild(inner_p);
        parent.appendChild(foreign_obj);

        // foreignObj size was set to 100% for fully rendering its content,
        // now we can reduce its size to the inner content
        // (it will avoid it to overlay some other svg elements)
        {
            let inner_bbox = inner_p.getBoundingClientRect();
            foreign_obj.setAttributeNS(null, "width", [inner_bbox.width + 2, "px"].join('')); // +2px are for the border
            foreign_obj.setAttributeNS(null, "height", [inner_bbox.height + 2, "px"].join(''));
        }

        var frgn_obj = map.select("#" + new_id_txt_annot),
            inner_ft = frgn_obj.select('p');
        inner_ft.call(drag_txt_annot);

        inner_ft.on("contextmenu", () => {
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems());
            });

        inner_ft.on("dblclick", () => { d3.event.stopPropagation(); });

        inner_ft.on("mouseover", () => {
                    inner_ft.attr("contentEditable", "true"); // Not sure if its better to change this than always letting it editable
                    inner_ft.style("background-color", "white");
                    inner_ft.style("border", "1px solid red");
                    inner_ft.on("keyup", () => {
                        clearTimeout(current_timeout);
                        current_timeout = setTimeout(end_edit_action, 7500);
                        state = "keyup";
                    })
                    // toogle the size of the container to 100% while we are using it :
                    foreign_obj.setAttributeNS(null, "width", "100%");
                    foreign_obj.setAttributeNS(null, "height", "100%");
                    d3.select("body").classed("noselect", true);
                })
                .on("mouseout", () => {
                    // use a small delay after leaving the box before deactiving it :
                    if(!state){
                        clearTimeout(current_timeout);
                        current_timeout = setTimeout(end_edit_action, 2500);
                    }
                });

        this.text_annot = frgn_obj;
        this.font_family = 'Verdana,Geneva,sans-serif';
        this.id = new_id_txt_annot;
    }

    editStyle(){
        let current_options = {size: this.text_annot.select("p").style("font-size"),
                               content: unescape(this.text_annot.select("p").html()),
                               font: ""};
        let self = this;
        make_confirm_dialog("styleTextAnnotation", i18next.t("app_page.text_box_edit_box.title"))
            .then(function(confirmed){
                $("#btn_info_text_annotation[data-tooltip_info!='']").qtip("destroy");
                if(!confirmed){
                    self.text_annot.select("p").text(current_options.content);
                    self.fontsize = current_options.size;
                }
            });
        let box_content = d3.select(".styleTextAnnotation").insert("div").attr("id", "styleTextAnnotation");
        box_content.append("p").html(i18next.t("app_page.text_box_edit_box.font_size"))
                .append("input").attrs({type: "number", id: "font_size", min: 0, max: 34, step: 0.1, value: this.fontsize})
                .on("change", function(){
                    self.fontsize = +this.value;
                    self.text_annot.select("p").style("font-size", self.fontsize + "px")
                });
        let font_select = box_content.append("p").html(i18next.t("app_page.text_box_edit_box.default_font"))
                .insert("select")
                .on("change", function(){
                    self.text_annot.select("p").style("font-family", this.value);
                });
        available_fonts.forEach(function(font){
            font_select.append("option").text(font[0]).attr("value", font[1])
        });
        font_select.node().selectedIndex = available_fonts.map(d => d[1] == this.font_family ? "1" : "0").indexOf("1");

        let content_modif_zone = box_content.append("p");
        content_modif_zone.append("span")
                .html(i18next.t("app_page.text_box_edit_box.content"));
        content_modif_zone.append("img")
            .attrs({"id": "btn_info_text_annotation", "src": "/static/img/Information.png", "width": "17", "height": "17",  "alt": "Information",
                    class: "info_tooltip", "data-tooltip_info": i18next.t("app_page.text_box_edit_box.info_tooltip")})
            .styles({"cursor": "pointer", "vertical-align": "bottom"});
        content_modif_zone.append("span")
                .html("<br>");
        content_modif_zone.append("textarea")
                .attr("id", "annotation_content")
                .style("margin", "5px 0px 0px")
                .on("keyup", function(){
                    self._text = this.value;
                    self.text_annot.select("p").html(this.value)
                });
        document.getElementById("annotation_content").value = current_options.content;
        $("#btn_info_text_annotation[data-tooltip_info!='']").qtip({
            content: {text: i18next.t("app_page.text_box_edit_box.info_tooltip")},
            style: { classes: 'qtip-bootstrap qtip_help' },
            position: { my: 'bottom left', at: 'center right', target: this },
            show: { solo: true }
        });

    }

    up_element(){
        up_legend(this.text_annot.node())
    }

    down_element(){
        down_legend(this.text_annot.node())
    }
}

/**
* Handler for the scale bar (only designed for one scale bar)
*
*/
var scaleBar = {
    create: function(){
        let scale_gp = map.append("g").attr("id", "scale_bar").attr("class", "legend scale"),
            x_pos = 40,
            y_pos = h - 100,
            bar_size = 50,
            self = this;

        this.x = x_pos;
        this.y = y_pos;
        this.bar_size = bar_size;
        this.unit = "km";
        this.precision = 0;
        this.nb_intermediate_markers = 0;
        this.start_end_bar = false;
        this.fixed_size = false;
        this.getDist();

        let getItems = () => [
            {"name": i18next.t("app_page.common.edit_style"), "action": () => { this.editStyle()}},
            {"name": i18next.t("app_page.common.delete"), "action": () => { this.remove(); }}
        ];

        let scale_context_menu = new ContextMenu();
        scale_gp.insert("rect")
            .attrs({x: x_pos - 5, y: y_pos-30, height: 30, width: bar_size + 5})
            .style("fill", "none");
        scale_gp.insert("rect").attr("id", "rect_scale")
            .attrs({x: x_pos, y: y_pos, height: 2, width: bar_size})
            .style("fill", "black");
//        scale_gp.insert("text")
//            .attrs({x: x_pos - 4, y: y_pos - 5})
//            .style("font", "11px 'Enriqueta', arial, serif")
//            .text("0");
        scale_gp.insert("text").attr("id", "text_limit_sup_scale")
            .attrs({x: x_pos + bar_size, y: y_pos - 5})
            .styles({"font": "11px 'Enriqueta', arial, serif",
                     "text-anchor": "middle"})
            .text(this.dist_txt + " km");

        scale_gp.call(drag_lgd_features);
        scale_gp.on("mouseover", function(){ this.style.cursor = "pointer";})
                .on("mouseout", function(){ this.style.cursor = "initial";})
                .on("contextmenu", (d,i) => {
                    d3.event.preventDefault();
                    return scale_context_menu
                       .showMenu(d3.event, document.querySelector("body"), getItems());
                });
        this.Scale = scale_gp;
        this.displayed = true;
        this.resize(Math.round(this.dist / 10) * 10);
    },
    getDist: function(){
        let x_pos = w / 2,
            y_pos = h / 2,
            transform = d3.zoomTransform(svg_map),
            z_trans = [transform.x, transform.y],
            z_scale = transform.k;

        if(isNaN(this.bar_size)){
            console.log("scaleBar.bar_size : NaN");
            this.bar_size = 1;
        }

        let pt1 = proj.invert([(x_pos - z_trans[0]) / z_scale, (y_pos - z_trans[1]) / z_scale]),
            pt2 = proj.invert([(x_pos + this.bar_size - z_trans[0]) / z_scale, (y_pos - z_trans[1]) / z_scale]);

        this.dist = coslaw_dist([pt1[1], pt1[0]], [pt2[1], pt2[0]]);
        let mult = this.unit == "km" ? 1
                    : this.unit == "m" ? 1000
                    : this.unit == "mi" ? 0.621371 : 1;
        this.dist_txt = (this.dist * mult).toFixed(this.precision);

    },
    resize: function(desired_dist){
        desired_dist = desired_dist || this.fixed_size;
        let ratio = +this.dist / desired_dist;
        let new_size = this.bar_size / ratio;

        this.Scale.select("#rect_scale")
                  .attr("width", new_size);
        this.Scale.select("#text_limit_sup_scale")
                  .attr("x", this.x + new_size / 2);
        this.bar_size = new_size;
        this.fixed_size = desired_dist;
        this.changeText();
        this.handle_start_end_bar();

    },
    changeText: function(){
        this.getDist();
        this.Scale.select("#text_limit_sup_scale").text(this.dist_txt + " " + this.unit);
    },
    update: function(){
        this.changeText();
        if(this.fixed_size)
            this.resize();
    },
    remove: function(){
        this.Scale.remove();
        this.Scale = null;
        this.displayed = false;
    },
//    update_interm_markers: function(){
//        this.Scale.selectAll(".interm_marker").remove();
//        if(this.nb_intermediate_markers == 0)
//            return;
//        else {
//            let k = +this.nb_intermediate_markers + 1;
//            let dist_b = +this.bar_size / k;
//            let markers_pos = [];
//            for(let i =1; i < this.nb_intermediate_markers + 1; i++){
//                markers_pos.push(this.x + dist_b * i);
//                this.Scale.insert("rect")
//                            .attr("class", "interm_marker")
//                            .attr("x", this.x + dist_b * i - 0.5)
//                            .attr("y", this.y - 4)
//                            .attr("width", "1px")
//                            .attr("height", "4px")
//            }
//        }
//    },
    handle_start_end_bar: function(){
        this.Scale.selectAll(".se_bar").remove();
        if(this.start_end_bar){
            this.Scale.insert("rect")
                        .attr("class", "start_bar se_bar")
                        .attr("x", this.x)
                        .attr("y", this.y - 4.5)
                        .attr("width", "1.5px")
                        .attr("height", "4.5px");

            this.Scale.insert("rect")
                        .attr("class", "end_bar se_bar")
                        .attr("x", this.x + this.bar_size - 1.5)
                        .attr("y", this.y - 4.5)
                        .attr("width", "1.5px")
                        .attr("height", "4.5px");
        }
    },
    editStyle: function(){
        var new_val,
            self = this;
        make_confirm_dialog("scaleBarEditBox", i18next.t("app_page.scale_bar_edit_box.title"))
            .then(function(confirmed){
                if(confirmed){
                    if(new_val)
                        self.resize(new_val);
                    else {
                        self.fixed_size = false;
                        self.changeText();
                    }
                }
            });
        var box_body = d3.select(".scaleBarEditBox");
        box_body.node().parentElement.style.width = "auto";
        box_body.append("h3")
                .html(i18next.t("app_page.scale_bar_edit_box.title"));
        box_body.append("p").style("display", "inline")
                .html(i18next.t("app_page.scale_bar_edit_box.fixed_size"));
        box_body.append("input")
                .attr("type", "checkbox")
                .attr("checked", self.fixed_size ? true : null)
                .on("change", function(){
                    if(box_body.select("#scale_fixed_field").attr("disabled")){
                        box_body.select("#scale_fixed_field").attr("disabled", null);
                        new_val = +box_body.select("#scale_fixed_field").attr("value");
                    } else {
                        box_body.select("#scale_fixed_field").attr("disabled", true);
                        new_val = false;
                    }
        });
        box_body.append("input")
                .attr('id', "scale_fixed_field")
                .attr("type", "number")
                .attr("disabled", self.fixed_size ? null : true)
                .attr("value", +this.dist_txt)
                .on("change", function(){ new_val = +this.value });

        let b = box_body.append("p");
        b.insert("span")
                .html(i18next.t("app_page.scale_bar_edit_box.precision"));
        b.insert("input")
                .attr('id', "scale_precision")
                .attrs({type: "number", min: 0, max: 6, step: 1, value: +this.precision})
                .style("width", "60px")
                .on("change", function(){
                    self.precision = +this.value;
                });

        let c = box_body.append("p");
        c.insert("span")
                .html(i18next.t("app_page.scale_bar_edit_box.unit"));
        let unit_select = c.insert("select")
                .attr('id', "scale_unit")
                .on("change", function(){
                    self.unit = this.value;
                });
        unit_select.append("option").text("km").attr("value", "km");
        unit_select.append("option").text("m").attr("value", "m");
        unit_select.append("option").text("mi").attr("value", "mi");
        unit_select.node().value = self.unit;

//        let d = box_body.append("p");
//        d.append("span")
//                .html(i18next.t("app_page.scale_bar_edit_box.intermediate_markers"));
//        d.append("input")
//                .attrs({type: "number", min: 0, max: 10, step: 1, value: self.nb_intermediate_markers})
//                .style("width", "60px")
//                .on("change", function(){
//                    self.nb_intermediate_markers = +this.value;
//                    self.update_interm_markers();
//        });

        let e = box_body.append("p");
        e.append("span")
                .html(i18next.t("app_page.scale_bar_edit_box.start_end_bar"));
        e.append("input")
                .attr("id", "checkbox_start_end_bar")
                .attr("type", "checkbox")
                .on("change", function(a){
                    self.start_end_bar = self.start_end_bar == true ? false : true;
                    self.handle_start_end_bar()
        });
        document.getElementById("checkbox_start_end_bar").checked = self.start_end_bar;

    },
    displayed: false
};

var northArrow = {
    display: function(){
        let x_pos = w - 100,
            y_pos = h - 100,
            self = this;

        let arrow_gp = map.append("g")
                        .attr("id", "north_arrow")
                        .attr("class", "legend")
                        .attr("scale", 1)
                        .attr("rotate", null)
                        .style("cursor", "pointer");

        this.svg_node = arrow_gp;
        this.displayed = true;

        this.arrow_img = arrow_gp.insert("image")
            .attr("x", x_pos)
            .attr("y", y_pos)
            .attr("height","30px")
            .attr("width", "30px")
            .attr("xlink:href", "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FscXVlXzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIzMTEgMjc4LjYgMzYuOSA1MC41IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDMxMSAyNzguNiAzNi45IDUwLjUiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBvbHlnb24gZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50cz0iMzEyLjMsMzI3LjkgMzI4LjksMzE4LjUgMzI4LjksMjk2LjQgIi8+DQo8cG9seWdvbiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSIzMjkuOSwyOTYuNCAzMjkuOSwzMTguNSAzNDYuNywzMjcuOCAiLz4NCjxnPg0KCTxwYXRoIGQ9Ik0zMjIuOCwyNzguNmgyLjlsNi43LDEwLjN2LTEwLjNoM3YxNS43aC0yLjlsLTYuNy0xMC4zdjEwLjNoLTNWMjc4LjZ6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==");

        this.drag_behavior = d3.drag()
             .subject(function() {
                    let t = d3.select(this.querySelector("image"));
                    return { x: +t.attr("x"), y: +t.attr("y") };
              })
            .on("start", () => {
                d3.event.sourceEvent.stopPropagation();
                if(map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
              })
            .on("end", () => {
                if(map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
              })
            .on("drag", function(){
                d3.event.sourceEvent.preventDefault();
                let t1 = this.querySelector("image"),
                    t2 = this.querySelector("rect"),
                    tx = +d3.event.x,
                    ty = +d3.event.y,
                    dim = t2.width.baseVal.value / 2;
                t1.x.baseVal.value = tx;
                t1.y.baseVal.value = ty;
                t2.x.baseVal.value = tx;
                t2.y.baseVal.value = ty;
                self.x_center = tx + dim;
                self.y_center = ty + dim;
              });

        let getItems = () => [
            {"name": i18next.t("app_page.common.options"), "action": () => { this.editStyle()}},
            {"name": i18next.t("app_page.common.delete"), "action": () => { this.remove(); }}
        ];

        let arrow_context_menu = new ContextMenu();

        let bbox = document.getElementById("north_arrow").getBoundingClientRect(),
            xy0_map = get_map_xy0();

        this.under_rect = arrow_gp.append("g")
            .insert("rect")
                .style("fill", "green")
                .style("fill-opacity", 0)
                .attr("x", bbox.left - xy0_map.x)
                .attr("y", bbox.top - xy0_map.y)
                .attr("height", bbox.height)
                .attr("width", bbox.width);

        this.x_center = bbox.left - xy0_map.x + bbox.width / 2;
        this.y_center = bbox.top - xy0_map.y + bbox.height / 2

        arrow_gp.call(this.drag_behavior);

        arrow_gp
            .on("mouseover", function(){
                self.under_rect.style("fill-opacity", 0.1);
                })
            .on("mouseout", function(){
                self.under_rect.style("fill-opacity", 0);
                })
            .on("contextmenu dblclick", (d,i) => {
                d3.event.preventDefault();
                return arrow_context_menu
                   .showMenu(d3.event, document.querySelector("body"), getItems());
            });
    },
    remove: function(){
        this.svg_node.remove();
        this.displayed = false;
    },
    editStyle: function(){
        var self = this,
            old_dim = +self.under_rect.attr("width"),
            old_rotate = !isNaN(+self.svg_node.attr("rotate")) ? +self.svg_node.attr("rotate") : 0,
            x_pos = +self.x_center - old_dim / 2,
            y_pos = +self.y_center - old_dim /2;

        make_confirm_dialog("arrowEditBox", i18next.t("app_page.north_arrow_edit_box.title"))
            .then(function(confirmed){
                if(confirmed){
                    null;
                }
            });

        var box_body = d3.select(".arrowEditBox");
        box_body.node().parentElement.style.width = "auto";
        box_body.append("h3")
                .html(i18next.t("app_page.north_arrow_edit_box.title"));
        box_body.append("p").style("margin-bottom", "0")
                .html(i18next.t("app_page.north_arrow_edit_box.size"));
        box_body.append("input")
                .attrs({type: "range", min: 1, max: 200, step: 1,
                        value: old_dim, id: "range_size_n_arrow"})
                .styles({"vertical-align": "middle", "width": "140px"})
                .on("change", function(){
                    let new_size = +this.value;
                    self.arrow_img.attr("width", new_size);
                    self.arrow_img.attr("height", new_size);
                    self.under_rect.attr("width", new_size);
                    self.under_rect.attr("height", new_size);
                    self.x_center = x_pos + new_size / 2;
                    self.y_center = y_pos + new_size / 2;
                    document.getElementById("txt_size_n_arrow").value = new_size;
                });
        box_body.append("input")
                .attrs({type: "number", min: 0, max: 200, step: 1, value: old_dim,
                        class: "without_spinner", id: "txt_size_n_arrow"})
                .style("width", "40px")
                .on("change", function(){
                    let elem = document.getElementById("range_size_n_arrow");
                    elem.value = +this.value;
                    elem.dispatchEvent(new Event("change"));
                });
        box_body.append("span").html(" px");

        box_body.append("p").style("margin-bottom", "0")
                .html(i18next.t("app_page.north_arrow_edit_box.rotation"));
        box_body.append("input")
                .attrs({type: "range", min: 0, max: 360, step: 0.1, id: "range_rotate_n_arrow"})
                .attr("value", old_rotate)
                .styles({"vertical-align": "middle", "width": "140px"})
                .on("change", function(){
                    let rotate_value = +this.value;
                    self.svg_node.attr("rotate", rotate_value);
                    self.svg_node.attr("transform", "rotate(" + [rotate_value, self.x_center, self.y_center] + ")");
                    document.getElementById("txt_rotate_n_arrow").value = rotate_value;
                });
        box_body.append("input")
                .attrs({type: "number", min: 0, max: 360, step: "any",
                        class: "without_spinner", id: "txt_rotate_n_arrow"})
                .attr("value", old_rotate)
                .style("width", "40px")
                .on("change", function(){
                    let rotate_value = +this.value;
                    self.svg_node.attr("rotate", rotate_value);
                    self.svg_node.attr("transform", "rotate(" + [rotate_value, self.x_center, self.y_center] + ")");
                    document.getElementById("range_rotate_n_arrow").value = rotate_value;
                });
        box_body.append("span").html("°");
    },
    displayed: false
}


class UserEllipse {
    constructor(id, origin_pt, parent=undefined){
        this.parent = parent || svg_map;
        this.svg_elem = d3.select(this.parent);
        this.pt1 = origin_pt;
        this.id = id;
        this.strokeWeight = 4;
        this.stroke_color = "rgb(0, 0, 0)";

        let self = this;
        this.drag_behavior = d3.drag()
             .subject(function() {
                    let t = d3.select(this.querySelector("ellipse"));
                    return { x: +t.attr("cx"), y: +t.attr("cy") };
              })
            .on("start", () => {
                d3.event.sourceEvent.stopPropagation();
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", null);
              })
            .on("end", () => {
                if(map_div.select("#hand_button").classed("active"))
                    zoom.on("zoom", zoom_without_redraw);
              })
            .on("drag", function(){
                d3.event.sourceEvent.preventDefault();
                let _t = this.querySelector("ellipse"),
                    tx = +d3.event.x,
                    ty = +d3.event.y;
                _t.cx.baseVal.value = tx;
                _t.cy.baseVal.value = ty;
                self.pt1[0] = tx;
                self.pt1[1] = ty;
              });

        this.draw()
    }

    draw(){
        let context_menu = new ContextMenu(),
            getItems = () =>  [
                {"name": i18next.t("app_page.common.edit_style"), "action": () => { this.editStyle(); }},
                {"name": i18next.t("app_page.common.up_element"), "action": () => { this.up_element(); }},
                {"name": i18next.t("app_page.common.down_element"), "action": () => { this.down_element(); }},
                {"name": i18next.t("app_page.common.delete"), "action": () => { this.ellipse.remove(); }}
            ];

        this.ellipse = this.svg_elem.append('g')
                .attrs({"class": "user_ellipse legend_features legend", "id": this.id});

        this.ellipse.insert("ellipse")
        		.attrs({"class":"legend_features",
        			  "cx": this.pt1[0], "cy": this.pt1[1],
        			  "rx": 30, "ry": 40})
                .styles({"stroke-width": this.strokeWeight,
                         stroke: this.stroke_color, fill: "rgb(255, 255, 255)",
                         "fill-opacity": 0});

        this.ellipse.call(this.drag_behavior);

        this.ellipse.on("contextmenu dblclick", () => {
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems());
            });
    }

    up_element(){
        up_legend(this.ellipse.node());
    }

    down_element(){
        down_legend(this.ellipse.node());
    }

    editStyle(){
        let self = this,
            ellipse_elem = self.ellipse.node().querySelector("ellipse"),
            current_options = {
                pt1: this.pt1.slice(),
                rx: ellipse_elem.rx.baseVal.value,
                ry: ellipse_elem.ry.baseVal.value
            };
//        let angle = (-this.calcAngle()).toFixed(0);

        make_confirm_dialog("styleBoxEllipse", i18next.t("app_page.ellipse_edit_box.title"))
            .then(function(confirmed){
                map.selectAll(".ctrl_pt").remove();
                if(confirmed) {
                    // Store shorcut of useful values :
                    self.strokeWeight = ellipse_elem.style.strokeWidth;
                    self.stroke_color = ellipse_elem.style.stroke;
                } else {
                    //Rollback on initials parameters :
                    ellipse_elem.cx.baseVal.value = current_options.pt1[0];
                    ellipse_elem.cy.baseVal.value = current_options.pt1[1];
                    ellipse_elem.rx.baseVal.value = current_options.rx;
                    ellipse_elem.ry.baseVal.value = current_options.ry;
                    self.pt1 = current_options.pt1.slice();
                    ellipse_elem.style.strokeWidth = self.strokeWeight;
                    ellipse_elem.style.stroke = self.stroke_color;
                }
            });
        let box_content = d3.select(".styleBoxEllipse").insert("div").attr("id", "styleBoxEllipse");
        let s1 = box_content.append("p");
        s1.append("p")
            .style("margin", "auto")
            .html(i18next.t("app_page.ellipse_edit_box.stroke_width"));
        s1.append("input")
            .attrs({type: "range", id: "ellipse_strokeWeight", min: 0, max: 34, step: 0.1, value: self.strokeWeight})
            .styles({width: "80px", "vertical-align": "middle"})
            .on("change", function(){
                ellipse_elem.style.strokeWidth = this.value;
                txt_line_weight.html(this.value + "px");
            });
        let txt_line_weight = s1.append("span").html(self.strokeWeight + " px");

        let s2 = box_content.append("p").style("margin", "auto");
        s2.append("p")
            .style("margin", "auto")
            .html(i18next.t("app_page.ellipse_edit_box.stroke_color"));
        s2.append("input")
            .attrs({type: "color", id: "ellipse_strokeColor", value: self.stroke_color})
            .on("change", function(){
                ellipse_elem.style.stroke = this.value;
            });

//        let s2 = box_content.append("p");
//        s2.append("p").html(i18next.t("app_page.ellipse_edit_box.ellispeAngle"))
//        s2.insert("input")
//            .attrs({id: "ellipse_angle", type: "range", value: angle, min: 0, max: 360, step: 1})
//            .styles({width: "80px", "vertical-align": "middle"})
//            .on("change", function(){
//                let distance = Math.sqrt((self.pt1[0] - self.pt2[0]) * (self.pt1[0] - self.pt2[0]) + (self.pt1[1] - self.pt2[1]) * (self.pt1[1] - self.pt2[1]));
//                let angle = -(+this.value);
//                let [nx, ny] = self.calcDestFromOAD(self.pt1, angle, distance);
//                line.x2.baseVal.value = nx;
//                line.y2.baseVal.value = ny;
//                document.getElementById("ellipse_angle_text").value = +this.value;
//            });
//
//        s2.insert("input")
//            .attrs({id: "ellipse_angle_text", class: "without_spinner", value: angle, min: 0, max: 1, step: 1})
//            .styles({width: "30px", "margin-left": "10px"})
//            .on("input", function(){
//                let elem = document.getElementById("ellipse_angle");
//                elem.value = this.value;
//                elem.dispatchEvent(new Event('change'));
//            });
//
//        s2.insert("span").html("°");

        let s3 = box_content.append("p");

        s3.append("button")
            .attr("class", "button_st4")
            .html(i18next.t("app_page.ellipse_edit_box.move_points"))
            .on("click", function(){
                let tmp_start_point = map.append("rect")
                    .attr("class", "ctrl_pt")
                    .attr("x", self.pt1[0] - ellipse_elem.rx.baseVal.value)
                    .attr("y", self.pt1[1])
                    .attr("height", 6).attr("width", 6)
                    .style("fill", "red")
                    .style("cursor", "grab")
                    .call(d3.drag().on("drag", function(){
                        let t = d3.select(this);
                        let nx = d3.event.x,
                            ny = d3.event.y;
                        t.attr("x", nx);
                        let dist = self.pt1[0] - +t.attr("x");
                        ellipse_elem.rx.baseVal.value = dist;
                    }));

                let tmp_end_point = map.append("rect")
                    .attr("class", "ctrl_pt")
                    .attr("x", self.pt1[0])
                    .attr("y", self.pt1[1] - ellipse_elem.ry.baseVal.value)
                    .attr("height", 6).attr("width", 6)
                    .style("fill", "red")
                    .style("cursor", "grab")
                    .call(d3.drag().on("drag", function(){
                        let t = d3.select(this);
                        let nx = d3.event.x,
                            ny = d3.event.y;
                        t.attr("y", ny);
                        let dist = self.pt1[1] - +t.attr("y");
                        ellipse_elem.ry.baseVal.value = dist;
                    }));
                let ellipseDialog = $(".styleBoxEllipse"),
                    original_position = ellipseDialog.dialog("option", "position");
                ellipseDialog.dialog("option", "position", { my: "left", at: "left", of: window });
                ellipseDialog.dialog("option", "draggable", false);
                ellipseDialog.hide();
                document.querySelector(".ui-widget-overlay").style.display = "none";
                let el = document.createElement("button");
                el.className = "button_st3";
                el.style = "float:right;background:forestgreen;font-size:22px;";
                el.innerHTML = i18next.t("app_page.common.done");
                el.onclick = function(){
                    document.querySelector(".ui-widget-overlay").style.display = "";
                    tmp_end_point.remove();
                    tmp_start_point.remove();
                    el.remove();
                    ellipseDialog.show();
                    ellipseDialog.dialog("option", "draggable", true);
                    ellipseDialog.dialog("option", "position", original_position);
                }
                document.querySelector(".styleBoxEllipse").parentElement.appendChild(el);
            });
    }
}