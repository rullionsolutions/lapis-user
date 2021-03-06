/*jslint node: true */

"use strict";

var Parent       = require("../base/Base")
  , Page         = require("../page/Page")
  ;

/**
* To represent an item in a hierachical menu structure, that references a page, report, external URL and/or is a container for other menu items",
*/
module.exports = Parent.clone({
    id                      : "MenuItem",
    level                   : 0,
    children                : [],
    visible                 : true
});


/*
 * The principle here is that a MenuItem should only be displayed if (a) it is a link to which the user has access, or
 * (b) it is the ancester of at least one MenuItem that satisfies (a).
 *
 * In order to fulfill the above using XmlStream (which must output XML is sequentially), the code must iterate through
 * the MenuItem tree in down-then-across order, and then work back upwards as necessary. Parent MenuItem objects usually
 * have no link themselves so should only be output if at least one child is output.
 *
 * renderItem() iterates through the tree, and then renderElement() calls back up the tree stack until it finds an
 * element that has already been output. *///-- bc


/**
* It adds a new child the children array (adds a new Menu item)",
* @param spec object",
* @return new object added in the childen array cloned from the input object spec"
*/
module.exports.define("addChild", function (spec) {
    var child;
    spec.level = this.level + 1;
    spec.id = "Level" + spec.level + "-" + this.children.length;
    spec.children = [];
    spec.parent_item = this;
    child = require("./MenuItem.Level" + spec.level).clone(spec);
    this.children.push(child);
    return child;
});


/**
* To return the MenuItem object 'owning' the given module, given that MenuItem objects can 'own' zero, one or multiple modules
* @param string module id
* @return MenuItem object or undefined
*/
module.exports.define("getItemByModule", function (module) {
    var i,
        out;

    if (this.modules && this.modules.indexOf(module) > -1) {
        return this;
    }
    for (i = 0; i < this.children.length; i += 1) {
        out = this.children[i].getItemByModule(module);
        if (out) {
            return out;
        }
    }
});


module.exports.define("getItemByPage", function (page) {
    var i,
        out;

    if (this.page && this.page === page) {
        return this;
    }

    for (i = 0; i < this.children.length; i +=1) {
        out = this.children[i].getItemByPage(page);
        if (out) {
            return out;
        }
    }
});


/**
* To determine the url of the item based on its page and url properties and whether the user has access to that url
* @return string url
*/
module.exports.define("getURL", function () {
    var url = "";
    if (this.page && Page.getPage(this.page)) {
        url = Page.getPage(this.page).getSimpleURL();
    }
    if (this.url) {
        url += this.url;
    }
    return url;
});


module.exports.define("getLabel", function () {
    return this.label || (this.page && Page.getPage(this.page) && (Page.getPage(this.page).short_title || Page.getPage(this.page).title)) || "[unknown label]";
});


module.exports.define("getURLandLabel", function (session) {
    var out = {};
    out.url   = this.getURL();
    out.label = this.getLabel();
    if (this.page && !session.allowedURL(out.url)) {                // §vani.core.7.5.2.1
        out.url   = null;
        out.label = null;
    }
    return out;
});


// entry-point for root MenuItem only...
module.exports.define("render", function (session, pr_elmt) {
    var pr_elmt_arr = [ pr_elmt ];
    this.renderItem(session, pr_elmt_arr);
});


module.exports.define("renderItem", function (session, pr_elmt_arr) {
    var i;
    if (!this.visible) {
        return;
    }
    for (i = 0; i < this.children.length; i += 1) {
        this.children[i].renderItem(session, pr_elmt_arr);
    }
    if (!pr_elmt_arr[this.level + 1]) {
        this.renderElement(session, pr_elmt_arr, false);
    }
    pr_elmt_arr[this.level + 1] = null;
});


module.exports.define("renderElement", function (session, pr_elmt_arr) {
    // if (!pr_elmt_arr[1]) {
    //     pr_elmt_arr[1] = pr_elmt_arr[0].addChild("ul", null, "nav nav-pills");
    //     pr_elmt_arr[1].attribute("role", "navigation");
    // }
    // return pr_elmt_arr[1];
    return pr_elmt_arr[0];
});


module.exports.define("getLICSSClass", function (render_children) {
    return "";
});
