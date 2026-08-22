/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$3=window,e$5=t$3.ShadowRoot&&(void 0===t$3.ShadyCSS||t$3.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),n$5=new WeakMap;let o$4 = class o{constructor(t,e,n){if(this._$cssResult$=true,n!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$5&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=n$5.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&n$5.set(s,t));}return t}toString(){return this.cssText}};const r$2=t=>new o$4("string"==typeof t?t:t+"",void 0,s$3),i$3=(t,...e)=>{const n=1===t.length?t[0]:e.reduce(((e,s,n)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1]),t[0]);return new o$4(n,t,s$3)},S$1=(s,n)=>{e$5?s.adoptedStyleSheets=n.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):n.forEach((e=>{const n=document.createElement("style"),o=t$3.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=e.cssText,s.appendChild(n);}));},c$1=e$5?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var s$2;const e$4=window,r$1=e$4.trustedTypes,h$1=r$1?r$1.emptyScript:"",o$3=e$4.reactiveElementPolyfillSupport,n$4={toAttribute(t,i){switch(i){case Boolean:t=t?h$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t);}catch(t){s=null;}}return s}},a$1=(t,i)=>i!==t&&(i==i||t==t),l$2={attribute:true,type:String,converter:n$4,reflect:false,hasChanged:a$1},d$1="finalized";let u$1 = class u extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=false,this.hasUpdated=false,this._$El=null,this._$Eu();}static addInitializer(t){var i;this.finalize(),(null!==(i=this.h)&&void 0!==i?i:this.h=[]).push(t);}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const e=this._$Ep(s,i);void 0!==e&&(this._$Ev.set(e,s),t.push(e));})),t}static createProperty(t,i=l$2){if(i.state&&(i.attribute=false),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,e=this.getPropertyDescriptor(t,s,i);void 0!==e&&Object.defineProperty(this.prototype,t,e);}}static getPropertyDescriptor(t,i,s){return {get(){return this[i]},set(e){const r=this[t];this[i]=e,this.requestUpdate(t,r,s);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)||l$2}static finalize(){if(this.hasOwnProperty(d$1))return  false;this[d$1]=true;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s]);}return this.elementStyles=this.finalizeStyles(this.styles),true}static finalizeStyles(i){const s=[];if(Array.isArray(i)){const e=new Set(i.flat(1/0).reverse());for(const i of e)s.unshift(c$1(i));}else void 0!==i&&s.push(c$1(i));return s}static _$Ep(t,i){const s=i.attribute;return  false===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach((t=>t(this)));}addController(t){var i,s;(null!==(i=this._$ES)&&void 0!==i?i:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t));}removeController(t){var i;null===(i=this._$ES)||void 0===i||i.splice(this._$ES.indexOf(t)>>>0,1);}_$Eg(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Ei.set(i,this[i]),delete this[i]);}));}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return S$1(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(true),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}));}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}));}attributeChangedCallback(t,i,s){this._$AK(t,s);}_$EO(t,i,s=l$2){var e;const r=this.constructor._$Ep(t,s);if(void 0!==r&&true===s.reflect){const h=(void 0!==(null===(e=s.converter)||void 0===e?void 0:e.toAttribute)?s.converter:n$4).toAttribute(i,s.type);this._$El=t,null==h?this.removeAttribute(r):this.setAttribute(r,h),this._$El=null;}}_$AK(t,i){var s;const e=this.constructor,r=e._$Ev.get(t);if(void 0!==r&&this._$El!==r){const t=e.getPropertyOptions(r),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(s=t.converter)||void 0===s?void 0:s.fromAttribute)?t.converter:n$4;this._$El=r,this[r]=h.fromAttribute(i,t.type),this._$El=null;}}requestUpdate(t,i,s){let e=true;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||a$1)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),true===s.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,s))):e=false),!this.isUpdatePending&&e&&(this._$E_=this._$Ej());}async _$Ej(){this.isUpdatePending=true;try{await this._$E_;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach(((t,i)=>this[i]=t)),this._$Ei=void 0);let i=false;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$Ek();}catch(t){throw i=false,this._$Ek(),t}i&&this._$AE(s);}willUpdate(t){}_$AE(t){var i;null===(i=this._$ES)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$Ek(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return  true}update(t){ void 0!==this._$EC&&(this._$EC.forEach(((t,i)=>this._$EO(i,this[i],t))),this._$EC=void 0),this._$Ek();}updated(t){}firstUpdated(t){}};u$1[d$1]=true,u$1.elementProperties=new Map,u$1.elementStyles=[],u$1.shadowRootOptions={mode:"open"},null==o$3||o$3({ReactiveElement:u$1}),(null!==(s$2=e$4.reactiveElementVersions)&&void 0!==s$2?s$2:e$4.reactiveElementVersions=[]).push("1.6.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var t$2;const i$2=window,s$1=i$2.trustedTypes,e$3=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,o$2="$lit$",n$3=`lit$${(Math.random()+"").slice(9)}$`,l$1="?"+n$3,h=`<${l$1}>`,r=document,u=()=>r.createComment(""),d=t=>null===t||"object"!=typeof t&&"function"!=typeof t,c=Array.isArray,v=t=>c(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),a="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${a}(?:([^\\s"'>=/]+)(${a}*=${a}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,w=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=w(1),T=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),E=new WeakMap,C=r.createTreeWalker(r,129,null,false);function P(t,i){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e$3?e$3.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,e=[];let l,r=2===i?"<svg>":"",u=f;for(let i=0;i<s;i++){const s=t[i];let d,c,v=-1,a=0;for(;a<s.length&&(u.lastIndex=a,c=u.exec(s),null!==c);)a=u.lastIndex,u===f?"!--"===c[1]?u=_:void 0!==c[1]?u=m:void 0!==c[2]?(y.test(c[2])&&(l=RegExp("</"+c[2],"g")),u=p):void 0!==c[3]&&(u=p):u===p?">"===c[0]?(u=null!=l?l:f,v=-1):void 0===c[1]?v=-2:(v=u.lastIndex-c[2].length,d=c[1],u=void 0===c[3]?p:'"'===c[3]?$:g):u===$||u===g?u=p:u===_||u===m?u=f:(u=p,l=void 0);const w=u===p&&t[i+1].startsWith("/>")?" ":"";r+=u===f?s+h:v>=0?(e.push(d),s.slice(0,v)+o$2+s.slice(v)+n$3+w):s+n$3+(-2===v?(e.push(void 0),i):w);}return [P(t,r+(t[s]||"<?>")+(2===i?"</svg>":"")),e]};class N{constructor({strings:t,_$litType$:i},e){let h;this.parts=[];let r=0,d=0;const c=t.length-1,v=this.parts,[a,f]=V(t,i);if(this.el=N.createElement(a,e),C.currentNode=this.el.content,2===i){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes);}for(;null!==(h=C.nextNode())&&v.length<c;){if(1===h.nodeType){if(h.hasAttributes()){const t=[];for(const i of h.getAttributeNames())if(i.endsWith(o$2)||i.startsWith(n$3)){const s=f[d++];if(t.push(i),void 0!==s){const t=h.getAttribute(s.toLowerCase()+o$2).split(n$3),i=/([.?@])?(.*)/.exec(s);v.push({type:1,index:r,name:i[2],strings:t,ctor:"."===i[1]?H:"?"===i[1]?L:"@"===i[1]?z:k});}else v.push({type:6,index:r});}for(const i of t)h.removeAttribute(i);}if(y.test(h.tagName)){const t=h.textContent.split(n$3),i=t.length-1;if(i>0){h.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)h.append(t[s],u()),C.nextNode(),v.push({type:2,index:++r});h.append(t[i],u());}}}else if(8===h.nodeType)if(h.data===l$1)v.push({type:2,index:r});else {let t=-1;for(;-1!==(t=h.data.indexOf(n$3,t+1));)v.push({type:7,index:r}),t+=n$3.length-1;}r++;}}static createElement(t,i){const s=r.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){var o,n,l,h;if(i===T)return i;let r=void 0!==e?null===(o=s._$Co)||void 0===o?void 0:o[e]:s._$Cl;const u=d(i)?void 0:i._$litDirective$;return (null==r?void 0:r.constructor)!==u&&(null===(n=null==r?void 0:r._$AO)||void 0===n||n.call(r,false),void 0===u?r=void 0:(r=new u(t),r._$AT(t,s,e)),void 0!==e?(null!==(l=(h=s)._$Co)&&void 0!==l?l:h._$Co=[])[e]=r:s._$Cl=r),void 0!==r&&(i=S(t,r._$AS(t,i.values),r,e)),i}class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var i;const{el:{content:s},parts:e}=this._$AD,o=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:r).importNode(s,true);C.currentNode=o;let n=C.nextNode(),l=0,h=0,u=e[0];for(;void 0!==u;){if(l===u.index){let i;2===u.type?i=new R(n,n.nextSibling,this,t):1===u.type?i=new u.ctor(n,u.name,u.strings,this,t):6===u.type&&(i=new Z(n,this,t)),this._$AV.push(i),u=e[++h];}l!==(null==u?void 0:u.index)&&(n=C.nextNode(),l++);}return C.currentNode=r,o}v(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class R{constructor(t,i,s,e){var o;this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cp=null===(o=null==e?void 0:e.isConnected)||void 0===o||o;}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===(null==t?void 0:t.nodeType)&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),d(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):v(t)?this.T(t):this._(t);}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t));}_(t){this._$AH!==A&&d(this._$AH)?this._$AA.nextSibling.data=t:this.$(r.createTextNode(t)),this._$AH=t;}g(t){var i;const{values:s,_$litType$:e}=t,o="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=N.createElement(P(e.h,e.h[0]),this.options)),e);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===o)this._$AH.v(s);else {const t=new M(o,this),i=t.u(this.options);t.v(s),this.$(i),this._$AH=t;}}_$AC(t){let i=E.get(t.strings);return void 0===i&&E.set(t.strings,i=new N(t)),i}T(t){c(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const o of t)e===i.length?i.push(s=new R(this.k(u()),this.k(u()),this,this.options)):s=i[e],s._$AI(o),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,false,true,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){var i;void 0===this._$AM&&(this._$Cp=t,null===(i=this._$AP)||void 0===i||i.call(this,t));}}class k{constructor(t,i,s,e,o){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,e){const o=this.strings;let n=false;if(void 0===o)t=S(this,t,i,0),n=!d(t)||t!==this._$AH&&t!==T,n&&(this._$AH=t);else {const e=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=S(this,e[s+l],i,l),h===T&&(h=this._$AH[l]),n||(n=!d(h)||h!==this._$AH[l]),h===A?t=A:t!==A&&(t+=(null!=h?h:"")+o[l+1]),this._$AH[l]=h;}n&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"");}}class H extends k{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}const I=s$1?s$1.emptyScript:"";class L extends k{constructor(){super(...arguments),this.type=4;}j(t){t&&t!==A?this.element.setAttribute(this.name,I):this.element.removeAttribute(this.name);}}class z extends k{constructor(t,i,s,e,o){super(t,i,s,e,o),this.type=5;}_$AI(t,i=this){var s;if((t=null!==(s=S(this,t,i,0))&&void 0!==s?s:A)===T)return;const e=this._$AH,o=t===A&&e!==A||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,n=t!==A&&(e===A||o);o&&this.element.removeEventListener(this.name,this,e),n&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t);}}const B=i$2.litHtmlPolyfillSupport;null==B||B(N,R),(null!==(t$2=i$2.litHtmlVersions)&&void 0!==t$2?t$2:i$2.litHtmlVersions=[]).push("2.8.0");const D=(t,i,s)=>{var e,o;const n=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:i;let l=n._$litPart$;if(void 0===l){const t=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:null;n._$litPart$=l=new R(i.insertBefore(u(),t),t,void 0,null!=s?s:{});}return l._$AI(t),l};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var l,o$1;class s extends u$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(i,this.renderRoot,this.renderOptions);}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(true);}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(false);}render(){return T}}s.finalized=true,s._$litElement$=true,null===(l=globalThis.litElementHydrateSupport)||void 0===l||l.call(globalThis,{LitElement:s});const n$2=globalThis.litElementPolyfillSupport;null==n$2||n$2({LitElement:s});(null!==(o$1=globalThis.litElementVersions)&&void 0!==o$1?o$1:globalThis.litElementVersions=[]).push("3.3.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$2=e=>n=>"function"==typeof n?((e,n)=>(customElements.define(e,n),n))(e,n):((e,n)=>{const{kind:t,elements:s}=n;return {kind:t,elements:s,finisher(n){customElements.define(e,n);}}})(e,n);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const i$1=(i,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(n){n.createProperty(e.key,i);}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this));},finisher(n){n.createProperty(e.key,i);}},e$1=(i,e,n)=>{e.constructor.createProperty(n,i);};function n$1(n){return (t,o)=>void 0!==o?e$1(n,t,o):i$1(n,t)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function t$1(t){return n$1({...t,state:true})}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var n;null!=(null===(n=window.HTMLSlotElement)||void 0===n?void 0:n.prototype.assignedElements)?(o,n)=>o.assignedElements(n):(o,n)=>o.assignedNodes(n).filter((o=>o.nodeType===Node.ELEMENT_NODE));

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t={ATTRIBUTE:1},e=t=>(...e)=>({_$litDirective$:t,values:e});class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i;}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o=e(class extends i{constructor(t$1){var i;if(super(t$1),t$1.type!==t.ATTRIBUTE||"class"!==t$1.name||(null===(i=t$1.strings)||void 0===i?void 0:i.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return " "+Object.keys(t).filter((i=>t[i])).join(" ")+" "}update(i,[s]){var r,o;if(void 0===this.it){this.it=new Set,void 0!==i.strings&&(this.nt=new Set(i.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in s)s[t]&&!(null===(r=this.nt)||void 0===r?void 0:r.has(t))&&this.it.add(t);return this.render(s)}const e=i.element.classList;this.it.forEach((t=>{t in s||(e.remove(t),this.it.delete(t));}));for(const t in s){const i=!!s[t];i===this.it.has(t)||(null===(o=this.nt)||void 0===o?void 0:o.has(t))||(i?(e.add(t),this.it.add(t)):(e.remove(t),this.it.delete(t)));}return T}});

const LEVEL_ORDER = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const LOG_PREFIX = "[custom-graph-card]";
/** Minimum level that reaches the browser console. */
const ACTIVE_LEVEL = "warn";
const log = (level, message, details) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[ACTIVE_LEVEL]) {
        return;
    }
    const consoleRecord = console;
    const write = (consoleRecord[level] ?? console.log).bind(console);
    if (details && Object.keys(details).length) {
        write(`${LOG_PREFIX} ${message}`, details);
    }
    else {
        write(`${LOG_PREFIX} ${message}`);
    }
};
/** Deduplicates repeated diagnostics so a redraw loop cannot flood the console. */
class OnceLogger {
    constructor(_log = log) {
        this._log = _log;
        this._seen = new Set();
    }
    warnOnce(key, message, level = "warn") {
        if (this._seen.has(key)) {
            return;
        }
        this._seen.add(key);
        this._log(level, message);
    }
    reset() {
        this._seen.clear();
    }
}

function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

function toInteger(dirtyNumber) {
  if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
    return NaN;
  }
  var number = Number(dirtyNumber);
  if (isNaN(number)) {
    return number;
  }
  return number < 0 ? Math.ceil(number) : Math.floor(number);
}

function requiredArgs(required, args) {
  if (args.length < required) {
    throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
  }
}

/**
 * @name toDate
 * @category Common Helpers
 * @summary Convert the given argument to an instance of Date.
 *
 * @description
 * Convert the given argument to an instance of Date.
 *
 * If the argument is an instance of Date, the function returns its clone.
 *
 * If the argument is a number, it is treated as a timestamp.
 *
 * If the argument is none of the above, the function returns Invalid Date.
 *
 * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
 *
 * @param {Date|Number} argument - the value to convert
 * @returns {Date} the parsed date in the local time zone
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Clone the date:
 * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Convert the timestamp to date:
 * const result = toDate(1392098430000)
 * //=> Tue Feb 11 2014 11:30:30
 */
function toDate(argument) {
  requiredArgs(1, arguments);
  var argStr = Object.prototype.toString.call(argument);

  // Clone the date
  if (argument instanceof Date || _typeof(argument) === 'object' && argStr === '[object Date]') {
    // Prevent the date to lose the milliseconds when passed to new Date() in IE10
    return new Date(argument.getTime());
  } else if (typeof argument === 'number' || argStr === '[object Number]') {
    return new Date(argument);
  } else {
    if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments");
      // eslint-disable-next-line no-console
      console.warn(new Error().stack);
    }
    return new Date(NaN);
  }
}

/**
 * @name addDays
 * @category Day Helpers
 * @summary Add the specified number of days to the given date.
 *
 * @description
 * Add the specified number of days to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of days to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} - the new date with the days added
 * @throws {TypeError} - 2 arguments required
 *
 * @example
 * // Add 10 days to 1 September 2014:
 * const result = addDays(new Date(2014, 8, 1), 10)
 * //=> Thu Sep 11 2014 00:00:00
 */
function addDays(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var date = toDate(dirtyDate);
  var amount = toInteger(dirtyAmount);
  if (isNaN(amount)) {
    return new Date(NaN);
  }
  if (!amount) {
    // If 0 days, no-op to avoid changing times in the hour before end of DST
    return date;
  }
  date.setDate(date.getDate() + amount);
  return date;
}

/**
 * @name addMonths
 * @category Month Helpers
 * @summary Add the specified number of months to the given date.
 *
 * @description
 * Add the specified number of months to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the months added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 5 months to 1 September 2014:
 * const result = addMonths(new Date(2014, 8, 1), 5)
 * //=> Sun Feb 01 2015 00:00:00
 */
function addMonths(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var date = toDate(dirtyDate);
  var amount = toInteger(dirtyAmount);
  if (isNaN(amount)) {
    return new Date(NaN);
  }
  if (!amount) {
    // If 0 months, no-op to avoid changing times in the hour before end of DST
    return date;
  }
  var dayOfMonth = date.getDate();

  // The JS Date object supports date math by accepting out-of-bounds values for
  // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
  // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
  // want except that dates will wrap around the end of a month, meaning that
  // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
  // we'll default to the end of the desired month by adding 1 to the desired
  // month and using a date of 0 to back up one day to the end of the desired
  // month.
  var endOfDesiredMonth = new Date(date.getTime());
  endOfDesiredMonth.setMonth(date.getMonth() + amount + 1, 0);
  var daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    // If we're already at the end of the month, then this is the correct date
    // and we're done.
    return endOfDesiredMonth;
  } else {
    // Otherwise, we now know that setting the original day-of-month value won't
    // cause an overflow, so set the desired day-of-month. Note that we can't
    // just set the date of `endOfDesiredMonth` because that object may have had
    // its time changed in the unusual case where where a DST transition was on
    // the last day of the month and its local time was in the hour skipped or
    // repeated next to a DST transition.  So we use `date` instead which is
    // guaranteed to still have the original time.
    date.setFullYear(endOfDesiredMonth.getFullYear(), endOfDesiredMonth.getMonth(), dayOfMonth);
    return date;
  }
}

/**
 * @name addMilliseconds
 * @category Millisecond Helpers
 * @summary Add the specified number of milliseconds to the given date.
 *
 * @description
 * Add the specified number of milliseconds to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the milliseconds added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
 * const result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:30.750
 */
function addMilliseconds(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var timestamp = toDate(dirtyDate).getTime();
  var amount = toInteger(dirtyAmount);
  return new Date(timestamp + amount);
}

var MILLISECONDS_IN_HOUR = 3600000;

/**
 * @name addHours
 * @category Hour Helpers
 * @summary Add the specified number of hours to the given date.
 *
 * @description
 * Add the specified number of hours to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of hours to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the hours added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 2 hours to 10 July 2014 23:00:00:
 * const result = addHours(new Date(2014, 6, 10, 23, 0), 2)
 * //=> Fri Jul 11 2014 01:00:00
 */
function addHours(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_HOUR);
}

var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

/**
 * @name startOfWeek
 * @category Week Helpers
 * @summary Return the start of a week for the given date.
 *
 * @description
 * Return the start of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the start of a week
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 *
 * @example
 * // The start of a week for 2 September 2014 11:55:00:
 * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
 * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfWeek(dirtyDate, options) {
  var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
  requiredArgs(1, arguments);
  var defaultOptions = getDefaultOptions();
  var weekStartsOn = toInteger((_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0);

  // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }
  var date = toDate(dirtyDate);
  var day = date.getDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
 * They usually appear for dates that denote time before the timezones were introduced
 * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
 * and GMT+01:00:00 after that date)
 *
 * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
 * which would lead to incorrect calculations.
 *
 * This function returns the timezone offset in milliseconds that takes seconds in account.
 */
function getTimezoneOffsetInMilliseconds(date) {
  var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
  utcDate.setUTCFullYear(date.getFullYear());
  return date.getTime() - utcDate.getTime();
}

/**
 * @name startOfDay
 * @category Day Helpers
 * @summary Return the start of a day for the given date.
 *
 * @description
 * Return the start of a day for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a day
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a day for 2 September 2014 11:55:00:
 * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 00:00:00
 */
function startOfDay(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

var MILLISECONDS_IN_DAY = 86400000;

/**
 * @name differenceInCalendarDays
 * @category Day Helpers
 * @summary Get the number of calendar days between the given dates.
 *
 * @description
 * Get the number of calendar days between the given dates. This means that the times are removed
 * from the dates and then the difference in days is calculated.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar days
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * const result = differenceInCalendarDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 * // How many calendar days are between
 * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
 * const result = differenceInCalendarDays(
 *   new Date(2011, 6, 3, 0, 1),
 *   new Date(2011, 6, 2, 23, 59)
 * )
 * //=> 1
 */
function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var startOfDayLeft = startOfDay(dirtyDateLeft);
  var startOfDayRight = startOfDay(dirtyDateRight);
  var timestampLeft = startOfDayLeft.getTime() - getTimezoneOffsetInMilliseconds(startOfDayLeft);
  var timestampRight = startOfDayRight.getTime() - getTimezoneOffsetInMilliseconds(startOfDayRight);

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
}

var MILLISECONDS_IN_MINUTE = 60000;

/**
 * @name addMinutes
 * @category Minute Helpers
 * @summary Add the specified number of minutes to the given date.
 *
 * @description
 * Add the specified number of minutes to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of minutes to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the minutes added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 30 minutes to 10 July 2014 12:00:00:
 * const result = addMinutes(new Date(2014, 6, 10, 12, 0), 30)
 * //=> Thu Jul 10 2014 12:30:00
 */
function addMinutes(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_MINUTE);
}

/**
 * @name addWeeks
 * @category Week Helpers
 * @summary Add the specified number of weeks to the given date.
 *
 * @description
 * Add the specified number of week to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of weeks to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the weeks added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 4 weeks to 1 September 2014:
 * const result = addWeeks(new Date(2014, 8, 1), 4)
 * //=> Mon Sep 29 2014 00:00:00
 */
function addWeeks(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  var days = amount * 7;
  return addDays(dirtyDate, days);
}

/**
 * @name addYears
 * @category Year Helpers
 * @summary Add the specified number of years to the given date.
 *
 * @description
 * Add the specified number of years to the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of years to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the years added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 5 years to 1 September 2014:
 * const result = addYears(new Date(2014, 8, 1), 5)
 * //=> Sun Sep 01 2019 00:00:00
 */
function addYears(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addMonths(dirtyDate, amount * 12);
}

/**
 * @name compareAsc
 * @category Common Helpers
 * @summary Compare the two dates and return -1, 0 or 1.
 *
 * @description
 * Compare the two dates and return 1 if the first date is after the second,
 * -1 if the first date is before the second or 0 if dates are equal.
 *
 * @param {Date|Number} dateLeft - the first date to compare
 * @param {Date|Number} dateRight - the second date to compare
 * @returns {Number} the result of the comparison
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Compare 11 February 1987 and 10 July 1989:
 * const result = compareAsc(new Date(1987, 1, 11), new Date(1989, 6, 10))
 * //=> -1
 *
 * @example
 * // Sort the array of dates:
 * const result = [
 *   new Date(1995, 6, 2),
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * ].sort(compareAsc)
 * //=> [
 * //   Wed Feb 11 1987 00:00:00,
 * //   Mon Jul 10 1989 00:00:00,
 * //   Sun Jul 02 1995 00:00:00
 * // ]
 */
function compareAsc(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var diff = dateLeft.getTime() - dateRight.getTime();
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
    // Return 0 if diff is 0; return NaN if diff is NaN
  } else {
    return diff;
  }
}

/**
 * Days in 1 week.
 *
 * @name daysInWeek
 * @constant
 * @type {number}
 * @default
 */

/**
 * Milliseconds in 1 hour
 *
 * @name millisecondsInHour
 * @constant
 * @type {number}
 * @default
 */
var millisecondsInHour = 3600000;

/**
 * @name differenceInCalendarMonths
 * @category Month Helpers
 * @summary Get the number of calendar months between the given dates.
 *
 * @description
 * Get the number of calendar months between the given dates.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar months
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many calendar months are between 31 January 2014 and 1 September 2014?
 * const result = differenceInCalendarMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 8
 */
function differenceInCalendarMonths(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  var monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * @name differenceInCalendarYears
 * @category Year Helpers
 * @summary Get the number of calendar years between the given dates.
 *
 * @description
 * Get the number of calendar years between the given dates.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar years
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many calendar years are between 31 December 2013 and 11 February 2015?
 * const result = differenceInCalendarYears(
 *   new Date(2015, 1, 11),
 *   new Date(2013, 11, 31)
 * )
 * //=> 2
 */
function differenceInCalendarYears(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  return dateLeft.getFullYear() - dateRight.getFullYear();
}

// for accurate equality comparisons of UTC timestamps that end up
// having the same representation in local time, e.g. one hour before
// DST ends vs. the instant that DST ends.
function compareLocalAsc(dateLeft, dateRight) {
  var diff = dateLeft.getFullYear() - dateRight.getFullYear() || dateLeft.getMonth() - dateRight.getMonth() || dateLeft.getDate() - dateRight.getDate() || dateLeft.getHours() - dateRight.getHours() || dateLeft.getMinutes() - dateRight.getMinutes() || dateLeft.getSeconds() - dateRight.getSeconds() || dateLeft.getMilliseconds() - dateRight.getMilliseconds();
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
    // Return 0 if diff is 0; return NaN if diff is NaN
  } else {
    return diff;
  }
}

/**
 * @name differenceInDays
 * @category Day Helpers
 * @summary Get the number of full days between the given dates.
 *
 * @description
 * Get the number of full day periods between two dates. Fractional days are
 * truncated towards zero.
 *
 * One "full day" is the distance between a local time in one day to the same
 * local time on the next or previous day. A full day can sometimes be less than
 * or more than 24 hours if a daylight savings change happens between two dates.
 *
 * To ignore DST and only measure exact 24-hour periods, use this instead:
 * `Math.floor(differenceInHours(dateLeft, dateRight)/24)|0`.
 *
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of full days according to the local timezone
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many full days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * const result = differenceInDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 365
 * // How many full days are between
 * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
 * const result = differenceInDays(
 *   new Date(2011, 6, 3, 0, 1),
 *   new Date(2011, 6, 2, 23, 59)
 * )
 * //=> 0
 * // How many full days are between
 * // 1 March 2020 0:00 and 1 June 2020 0:00 ?
 * // Note: because local time is used, the
 * // result will always be 92 days, even in
 * // time zones where DST starts and the
 * // period has only 92*24-1 hours.
 * const result = differenceInDays(
 *   new Date(2020, 5, 1),
 *   new Date(2020, 2, 1)
 * )
//=> 92
 */
function differenceInDays(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var sign = compareLocalAsc(dateLeft, dateRight);
  var difference = Math.abs(differenceInCalendarDays(dateLeft, dateRight));
  dateLeft.setDate(dateLeft.getDate() - sign * difference);

  // Math.abs(diff in full days - diff in calendar days) === 1 if last calendar day is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastDayNotFull = Number(compareLocalAsc(dateLeft, dateRight) === -sign);
  var result = sign * (difference - isLastDayNotFull);
  // Prevent negative zero
  return result === 0 ? 0 : result;
}

/**
 * @name differenceInMilliseconds
 * @category Millisecond Helpers
 * @summary Get the number of milliseconds between the given dates.
 *
 * @description
 * Get the number of milliseconds between the given dates.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of milliseconds
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many milliseconds are between
 * // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
 * const result = differenceInMilliseconds(
 *   new Date(2014, 6, 2, 12, 30, 21, 700),
 *   new Date(2014, 6, 2, 12, 30, 20, 600)
 * )
 * //=> 1100
 */
function differenceInMilliseconds(dateLeft, dateRight) {
  requiredArgs(2, arguments);
  return toDate(dateLeft).getTime() - toDate(dateRight).getTime();
}

var roundingMap = {
  ceil: Math.ceil,
  round: Math.round,
  floor: Math.floor,
  trunc: function trunc(value) {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  } // Math.trunc is not supported by IE
};

var defaultRoundingMethod = 'trunc';
function getRoundingMethod(method) {
  return roundingMap[defaultRoundingMethod];
}

/**
 * @name differenceInHours
 * @category Hour Helpers
 * @summary Get the number of hours between the given dates.
 *
 * @description
 * Get the number of hours between the given dates.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @param {Object} [options] - an object with options.
 * @param {String} [options.roundingMethod='trunc'] - a rounding method (`ceil`, `floor`, `round` or `trunc`)
 * @returns {Number} the number of hours
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many hours are between 2 July 2014 06:50:00 and 2 July 2014 19:00:00?
 * const result = differenceInHours(
 *   new Date(2014, 6, 2, 19, 0),
 *   new Date(2014, 6, 2, 6, 50)
 * )
 * //=> 12
 */
function differenceInHours(dateLeft, dateRight, options) {
  requiredArgs(2, arguments);
  var diff = differenceInMilliseconds(dateLeft, dateRight) / millisecondsInHour;
  return getRoundingMethod()(diff);
}

/**
 * @name endOfDay
 * @category Day Helpers
 * @summary Return the end of a day for the given date.
 *
 * @description
 * Return the end of a day for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of a day
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of a day for 2 September 2014 11:55:00:
 * const result = endOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 23:59:59.999
 */
function endOfDay(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * @name endOfMonth
 * @category Month Helpers
 * @summary Return the end of a month for the given date.
 *
 * @description
 * Return the end of a month for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of a month
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of a month for 2 September 2014 11:55:00:
 * const result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 23:59:59.999
 */
function endOfMonth(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var month = date.getMonth();
  date.setFullYear(date.getFullYear(), month + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * @name isLastDayOfMonth
 * @category Month Helpers
 * @summary Is the given date the last day of a month?
 *
 * @description
 * Is the given date the last day of a month?
 *
 * @param {Date|Number} date - the date to check
 * @returns {Boolean} the date is the last day of a month
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Is 28 February 2014 the last day of a month?
 * const result = isLastDayOfMonth(new Date(2014, 1, 28))
 * //=> true
 */
function isLastDayOfMonth(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  return endOfDay(date).getTime() === endOfMonth(date).getTime();
}

/**
 * @name differenceInMonths
 * @category Month Helpers
 * @summary Get the number of full months between the given dates.
 *
 * @description
 * Get the number of full months between the given dates using trunc as a default rounding method.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of full months
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many full months are between 31 January 2014 and 1 September 2014?
 * const result = differenceInMonths(new Date(2014, 8, 1), new Date(2014, 0, 31))
 * //=> 7
 */
function differenceInMonths(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var sign = compareAsc(dateLeft, dateRight);
  var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight));
  var result;

  // Check for the difference of less than month
  if (difference < 1) {
    result = 0;
  } else {
    if (dateLeft.getMonth() === 1 && dateLeft.getDate() > 27) {
      // This will check if the date is end of Feb and assign a higher end of month date
      // to compare it with Jan
      dateLeft.setDate(30);
    }
    dateLeft.setMonth(dateLeft.getMonth() - sign * difference);

    // Math.abs(diff in full months - diff in calendar months) === 1 if last calendar month is not full
    // If so, result must be decreased by 1 in absolute value
    var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign;

    // Check for cases of one full calendar month
    if (isLastDayOfMonth(toDate(dirtyDateLeft)) && difference === 1 && compareAsc(dirtyDateLeft, dateRight) === 1) {
      isLastMonthNotFull = false;
    }
    result = sign * (difference - Number(isLastMonthNotFull));
  }

  // Prevent negative zero
  return result === 0 ? 0 : result;
}

/**
 * @name differenceInYears
 * @category Year Helpers
 * @summary Get the number of full years between the given dates.
 *
 * @description
 * Get the number of full years between the given dates.
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of full years
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many full years are between 31 December 2013 and 11 February 2015?
 * const result = differenceInYears(new Date(2015, 1, 11), new Date(2013, 11, 31))
 * //=> 1
 */
function differenceInYears(dirtyDateLeft, dirtyDateRight) {
  requiredArgs(2, arguments);
  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var sign = compareAsc(dateLeft, dateRight);
  var difference = Math.abs(differenceInCalendarYears(dateLeft, dateRight));

  // Set both dates to a valid leap year for accurate comparison when dealing
  // with leap days
  dateLeft.setFullYear(1584);
  dateRight.setFullYear(1584);

  // Math.abs(diff in full years - diff in calendar years) === 1 if last calendar year is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastYearNotFull = compareAsc(dateLeft, dateRight) === -sign;
  var result = sign * (difference - Number(isLastYearNotFull));
  // Prevent negative zero
  return result === 0 ? 0 : result;
}

/**
 * @name startOfMonth
 * @category Month Helpers
 * @summary Return the start of a month for the given date.
 *
 * @description
 * Return the start of a month for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a month
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a month for 2 September 2014 11:55:00:
 * const result = startOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfMonth(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @name endOfYear
 * @category Year Helpers
 * @summary Return the end of a year for the given date.
 *
 * @description
 * Return the end of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of a year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of a year for 2 September 2014 11:55:00:
 * const result = endOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Dec 31 2014 23:59:59.999
 */
function endOfYear(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var year = date.getFullYear();
  date.setFullYear(year + 1, 0, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * @name startOfYear
 * @category Year Helpers
 * @summary Return the start of a year for the given date.
 *
 * @description
 * Return the start of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a year for 2 September 2014 11:55:00:
 * const result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Jan 01 2014 00:00:00
 */
function startOfYear(dirtyDate) {
  requiredArgs(1, arguments);
  var cleanDate = toDate(dirtyDate);
  var date = new Date(0);
  date.setFullYear(cleanDate.getFullYear(), 0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @name endOfHour
 * @category Hour Helpers
 * @summary Return the end of an hour for the given date.
 *
 * @description
 * Return the end of an hour for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of an hour
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of an hour for 2 September 2014 11:55:00:
 * const result = endOfHour(new Date(2014, 8, 2, 11, 55))
 * //=> Tue Sep 02 2014 11:59:59.999
 */
function endOfHour(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  date.setMinutes(59, 59, 999);
  return date;
}

/**
 * @name endOfWeek
 * @category Week Helpers
 * @summary Return the end of a week for the given date.
 *
 * @description
 * Return the end of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the end of a week
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 *
 * @example
 * // The end of a week for 2 September 2014 11:55:00:
 * const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sat Sep 06 2014 23:59:59.999
 *
 * @example
 * // If the week starts on Monday, the end of the week for 2 September 2014 11:55:00:
 * const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
 * //=> Sun Sep 07 2014 23:59:59.999
 */
function endOfWeek(dirtyDate, options) {
  var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
  requiredArgs(1, arguments);
  var defaultOptions = getDefaultOptions();
  var weekStartsOn = toInteger((_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0);

  // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }
  var date = toDate(dirtyDate);
  var day = date.getDay();
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  date.setDate(date.getDate() + diff);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * @name startOfHour
 * @category Hour Helpers
 * @summary Return the start of an hour for the given date.
 *
 * @description
 * Return the start of an hour for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of an hour
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of an hour for 2 September 2014 11:55:00:
 * const result = startOfHour(new Date(2014, 8, 2, 11, 55))
 * //=> Tue Sep 02 2014 11:00:00
 */
function startOfHour(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  date.setMinutes(0, 0, 0);
  return date;
}

/**
 * @name subDays
 * @category Day Helpers
 * @summary Subtract the specified number of days from the given date.
 *
 * @description
 * Subtract the specified number of days from the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of days to be subtracted. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the days subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 10 days from 1 September 2014:
 * const result = subDays(new Date(2014, 8, 1), 10)
 * //=> Fri Aug 22 2014 00:00:00
 */
function subDays(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addDays(dirtyDate, -amount);
}

/**
 * @name subMonths
 * @category Month Helpers
 * @summary Subtract the specified number of months from the given date.
 *
 * @description
 * Subtract the specified number of months from the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be subtracted. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the months subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 5 months from 1 February 2015:
 * const result = subMonths(new Date(2015, 1, 1), 5)
 * //=> Mon Sep 01 2014 00:00:00
 */
function subMonths(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addMonths(dirtyDate, -amount);
}

/**
 * @name subHours
 * @category Hour Helpers
 * @summary Subtract the specified number of hours from the given date.
 *
 * @description
 * Subtract the specified number of hours from the given date.
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of hours to be subtracted. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the hours subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 2 hours from 11 July 2014 01:00:00:
 * const result = subHours(new Date(2014, 6, 11, 1, 0), 2)
 * //=> Thu Jul 10 2014 23:00:00
 */
function subHours(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return addHours(dirtyDate, -amount);
}

/** Home Assistant's recorder buckets weeks starting on Monday. */
const WEEK_OPTIONS = { weekStartsOn: 1 };
/**
 * Above this a chart is unusable anyway and the browser tab stalls building it:
 * `5minute` over a year is ~105.000 buckets, one point per bucket per series,
 * and a bar grid of the same size on top. It is a guard against a
 * misconfiguration, not a display limit - `resolveAggregationPlan` keeps the
 * count in range before it gets here.
 */
const MAX_BUCKETS = 5_000;
/** Nominal length of one bucket, used to size a range before it is built. */
const BUCKET_LENGTH_MS = {
    "5minute": 5 * 60_000,
    hour: 60 * 60_000,
    day: 24 * 60 * 60_000,
    week: 7 * 24 * 60 * 60_000,
    month: 28 * 24 * 60 * 60_000,
    year: 365 * 24 * 60 * 60_000,
};
/**
 * Roughly how many buckets an interval produces over a range. Month and year
 * use their shortest possible length, so the estimate never undercounts.
 */
const estimateBucketCount = (start, end, period) => {
    if (period === "raw" || period === "disabled") {
        return 0;
    }
    const span = Math.max((end ?? new Date()).getTime() - start.getTime(), 0);
    return Math.ceil(span / BUCKET_LENGTH_MS[period]);
};
const advanceBucket = (date, period) => {
    switch (period) {
        case "5minute":
            return addMinutes(date, 5);
        case "hour":
            return addHours(date, 1);
        case "day":
            return addDays(date, 1);
        case "week":
            return addWeeks(date, 1);
        case "month":
            return addMonths(date, 1);
        case "year":
            return addYears(date, 1);
        default:
            return addHours(date, 1);
    }
};
const alignBucketStart = (start, period) => {
    const date = new Date(start);
    switch (period) {
        case "5minute":
            date.setSeconds(0, 0);
            date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
            return date;
        case "hour":
            date.setMinutes(0, 0, 0);
            return date;
        case "day":
            return startOfDay(date);
        case "week":
            return startOfWeek(date, WEEK_OPTIONS);
        case "month":
            return startOfMonth(date);
        case "year":
            return startOfYear(date);
        default:
            date.setMinutes(0, 0, 0);
            return date;
    }
};
/**
 * Produces every bucket timestamp of the visible range. Line series are
 * normalized onto this sequence so gaps stay gaps instead of being interpolated
 * across, and bars share one common x position per bucket.
 *
 * Returns `undefined` when no fixed grid exists (open-ended range, raw history
 * or disabled aggregation).
 */
const buildBucketSequence = (start, end, period) => {
    if (end === null ||
        period === undefined ||
        period === "raw" ||
        period === "disabled") {
        return undefined;
    }
    if (end < start) {
        return [start];
    }
    const buckets = [];
    let cursor = alignBucketStart(start, period);
    let iterations = 0;
    while (cursor.getTime() <= end && iterations < MAX_BUCKETS) {
        buckets.push(cursor.getTime());
        const next = advanceBucket(cursor, period);
        if (next.getTime() === cursor.getTime()) {
            break;
        }
        cursor = next;
        iterations += 1;
    }
    return buckets;
};

const DEFAULT_TIMESPAN = { mode: "energy" };
const CALENDAR_PERIODS = [
    "hour",
    "day",
    "week",
    "month",
    "year",
];
const isCalendarPeriod = (period) => CALENDAR_PERIODS.includes(period);
const todayRange = () => ({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
});
const normalizeCount = (count) => typeof count === "number" && Number.isInteger(count) && count >= 1 ? count : 1;
/**
 * Rolling windows are anchored to a rounded "now" so the range only moves when
 * the aligned time advances - otherwise every render would refetch.
 */
const roundedNow = (period) => {
    const now = new Date();
    switch (period) {
        case "last_60_minutes":
        case "last_24_hours":
            now.setSeconds(0, 0);
            return now;
        case "last_7_days":
        case "last_30_days":
            if (now.getMinutes() >= 20) {
                now.setHours(now.getHours() + 1);
            }
            now.setMinutes(20, 0, 0);
            return now;
        case "last_12_months":
            now.setHours(0, 0, 0, 0);
            return now;
        default:
            return now;
    }
};
const calendarBase = (period) => {
    const now = new Date();
    switch (period) {
        case "hour":
            return { start: startOfHour(now), end: endOfHour(now) };
        case "day":
            return todayRange();
        case "week":
            return {
                start: startOfWeek(now, WEEK_OPTIONS),
                end: endOfWeek(now, WEEK_OPTIONS),
            };
        case "month":
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case "year":
        default:
            return { start: startOfYear(now), end: endOfYear(now) };
    }
};
const resolveCalendarPeriod = (period, offset, count) => {
    const base = calendarBase(period);
    switch (period) {
        case "hour": {
            const endStart = addHours(base.start, offset);
            return {
                start: addHours(endStart, -(count - 1)),
                end: addHours(base.end, offset),
            };
        }
        case "day": {
            const endStart = addDays(base.start, offset);
            return {
                start: addDays(endStart, -(count - 1)),
                end: addDays(base.end, offset),
            };
        }
        case "week": {
            const endStart = addWeeks(base.start, offset);
            return {
                start: addWeeks(endStart, -(count - 1)),
                end: addWeeks(base.end, offset),
            };
        }
        case "month": {
            const endStart = addMonths(base.start, offset);
            return {
                start: addMonths(endStart, -(count - 1)),
                end: addMonths(base.end, offset),
            };
        }
        case "year":
        default: {
            const endStart = addYears(base.start, offset);
            return {
                start: addYears(endStart, -(count - 1)),
                end: addYears(base.end, offset),
            };
        }
    }
};
const resolveRollingPeriod = (period, offset) => {
    const now = roundedNow(period);
    switch (period) {
        case "last_60_minutes": {
            const end = addHours(now, offset);
            return { start: addMinutes(end, -60), end };
        }
        case "last_24_hours": {
            const end = addDays(now, offset);
            return { start: subHours(end, 24), end };
        }
        case "last_7_days": {
            const end = addDays(now, offset);
            return { start: subDays(end, 7), end };
        }
        case "last_30_days": {
            const end = addDays(now, offset);
            return { start: subDays(end, 30), end };
        }
        case "last_12_months":
        default: {
            const end = addMonths(now, offset);
            return { start: subMonths(end, 12), end };
        }
    }
};
const resolveFixedPeriod = (start, end) => {
    const startDate = start ? new Date(start) : startOfDay(new Date());
    if (Number.isNaN(startDate.getTime())) {
        throw new Error("Invalid start date in fixed timespan configuration");
    }
    const endDate = end ? new Date(end) : endOfDay(startDate);
    if (Number.isNaN(endDate.getTime())) {
        throw new Error("Invalid end date in fixed timespan configuration");
    }
    return { start: startDate, end: endDate };
};
/**
 * Resolves the visible range for the configured timespan mode.
 *
 * `energyRange` carries the range published by the energy date picker; it is
 * `undefined` while no picker has been found yet.
 */
const resolveTimespan = (timespan, energyRange) => {
    switch (timespan.mode) {
        case "energy":
            return energyRange;
        case "relative":
            return isCalendarPeriod(timespan.period)
                ? resolveCalendarPeriod(timespan.period, timespan.offset ?? 0, normalizeCount(timespan.count))
                : resolveRollingPeriod(timespan.period, timespan.offset ?? 0);
        case "fixed":
            return resolveFixedPeriod(timespan.start, timespan.end);
        default:
            return undefined;
    }
};
const isRollingTimespan = (timespan) => timespan.mode === "relative" && timespan.period.startsWith("last_");

/** Options that exist in comparable cards but are intentionally not supported. */
const UNSUPPORTED_CARD_OPTIONS = [
    "hide_legend",
    "expand_legend",
    "legend_sort",
    "show_tooltip",
    "tooltip_precision",
    "show_x_axis_pointer",
    "show_y_axis_pointer",
    "show_stack_sums",
    "show_unit",
    "color_cycle_dark",
];
const UNSUPPORTED_SERIES_OPTIONS = [
    "show_in_legend",
    "show_in_tooltip",
    "hidden_by_default",
    "pv_production_entity",
];
const warnUnsupported = (target, keys, context) => {
    const found = keys.filter((key) => target[key] !== undefined);
    if (found.length) {
        log("warn", `${context} uses unsupported option(s): ${found.join(", ")}. They are ignored.`);
    }
};
/**
 * Validates a card configuration and returns it with defaults applied.
 *
 * Only a missing series list is fatal - everything else is reported as a
 * warning so a single broken series cannot take down the whole dashboard.
 */
const normalizeConfig = (config) => {
    if (!config.series || !Array.isArray(config.series) || !config.series.length) {
        throw new Error("At least one series must be configured");
    }
    warnUnsupported(config, UNSUPPORTED_CARD_OPTIONS, "The card");
    config.series.forEach((series, index) => {
        if (!series) {
            log("warn", `Series at index ${index} is empty and is ignored.`);
            return;
        }
        warnUnsupported(series, UNSUPPORTED_SERIES_OPTIONS, `Series ${index}`);
        if (series.source === "forecast") {
            log("warn", `Series ${index} uses "source: forecast", which this card does not support. The series is skipped.`);
        }
        const hasStatistic = !!series.statistic_id?.trim();
        const hasCalculation = !!series.calculation;
        if (hasStatistic && hasCalculation) {
            log("warn", `Series ${index} defines both statistic_id and calculation. The calculation wins.`);
        }
        if (!hasStatistic && !hasCalculation) {
            log("warn", `Series ${index} defines neither statistic_id nor calculation and is skipped.`);
        }
        if (hasCalculation) {
            const terms = series.calculation?.terms ?? [];
            if (!terms.length) {
                log("warn", `The calculation of series ${index} has no terms and is skipped.`);
            }
            terms.forEach((term, termIndex) => {
                if (term.statistic_id === undefined && term.constant === undefined) {
                    log("warn", `Calculation term ${termIndex} of series ${index} has neither statistic_id nor constant and is ignored.`);
                }
            });
        }
    });
    return {
        ...config,
        timespan: config.timespan ?? DEFAULT_TIMESPAN,
        allow_compare: config.allow_compare ?? true,
        series: config.series.filter((series) => !!series && series.source !== "forecast"),
    };
};

const fetchStatisticsMetadata = (hass, statisticIds) => hass.callWS({
    type: "recorder/get_statistics_metadata",
    statistic_ids: statisticIds,
});
const fetchStatistics = (hass, startTime, endTime, statisticIds, period, types) => hass.callWS({
    type: "recorder/statistics_during_period",
    start_time: startTime.toISOString(),
    end_time: endTime?.toISOString(),
    statistic_ids: statisticIds,
    period,
    types,
});
/** `true` when at least one of the requested ids returned samples. */
const statisticsHaveData = (statistics, ids) => {
    if (!ids.length) {
        return true;
    }
    return ids.some((id) => statistics?.[id]?.length);
};
const maxStatisticsEnd = (statistics) => {
    if (!statistics) {
        return undefined;
    }
    let maxEnd;
    Object.values(statistics).forEach((entries) => {
        entries?.forEach((entry) => {
            const end = entry.end ?? entry.start;
            if (typeof end === "number") {
                maxEnd = maxEnd === undefined ? end : Math.max(maxEnd, end);
            }
        });
    });
    return maxEnd;
};
/** Merges freshly streamed samples into an existing set, keyed by bucket end. */
const mergeStatistics = (base, patch) => {
    if (!base) {
        return patch;
    }
    const merged = { ...base };
    Object.entries(patch).forEach(([id, entries]) => {
        const existing = merged[id];
        if (!existing?.length) {
            merged[id] = entries;
            return;
        }
        const combined = [...existing];
        const indexByKey = new Map();
        combined.forEach((entry, idx) => {
            indexByKey.set(entry.end ?? entry.start ?? idx, idx);
        });
        entries.forEach((entry) => {
            const key = entry.end ?? entry.start;
            const idx = indexByKey.get(key);
            if (idx !== undefined) {
                combined[idx] = entry;
            }
            else {
                combined.push(entry);
                indexByKey.set(key, combined.length - 1);
            }
        });
        combined.sort((a, b) => (a.end ?? a.start) - (b.end ?? b.start));
        merged[id] = combined;
    });
    return merged;
};
/**
 * Restricts samples to the visible range. One sample before and after the range
 * is kept so line and step charts still reach both edges of the chart.
 */
const trimStatisticsToRange = (statistics, start, end) => {
    const trimmed = {};
    Object.entries(statistics).forEach(([id, entries]) => {
        if (!entries?.length) {
            trimmed[id] = [];
            return;
        }
        let pre;
        let post;
        const inRange = [];
        entries.forEach((entry) => {
            const entryStart = entry.start ?? entry.end;
            const entryEnd = entry.end ?? entry.start;
            if (entryStart === undefined || entryEnd === undefined) {
                return;
            }
            if (end !== null && entryStart > end) {
                post = post ?? entry;
                return;
            }
            if (entryEnd < start) {
                pre = entry;
                return;
            }
            inRange.push(entry);
        });
        if (pre) {
            inRange.unshift(pre);
        }
        if (post) {
            inRange.push(post);
        }
        trimmed[id] = inRange;
    });
    return trimmed;
};

/** Binary-ish states that are rendered as 1/0 so they can be charted. */
const BINARY_STATE_MAP = {
    on: 1,
    open: 1,
    opening: 1,
    true: 1,
    off: 0,
    closed: 0,
    closing: 0,
    false: 0,
};
const EMPTY_STATES = new Set(["", "unknown", "unavailable"]);
const normalizeTimestamp = (value) => typeof value === "number" ? Math.round(value * 1000) : undefined;
const normalizeStateValue = (raw) => {
    const key = raw.trim().toLowerCase();
    if (key in BINARY_STATE_MAP) {
        return BINARY_STATE_MAP[key];
    }
    if (EMPTY_STATES.has(key)) {
        return null;
    }
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
};
const fetchRawHistoryStates = (hass, startTime, endTime, entityIds, options) => {
    const payload = {
        type: "history/history_during_period",
        start_time: startTime.toISOString(),
        minimal_response: true,
        no_attributes: true,
    };
    if (endTime) {
        payload.end_time = endTime.toISOString();
    }
    if (options?.significant_changes_only !== undefined) {
        payload.significant_changes_only = options.significant_changes_only;
    }
    if (entityIds.length) {
        payload.entity_ids = entityIds;
    }
    return hass.callWS(payload);
};
const subscribeRawHistoryStream = (hass, startTime, entityIds, onMessage, options) => {
    const params = {
        type: "history/stream",
        entity_ids: entityIds,
        start_time: startTime.toISOString(),
        minimal_response: true,
        no_attributes: true,
    };
    if (options?.significant_changes_only !== undefined) {
        params.significant_changes_only = options.significant_changes_only;
    }
    return hass.connection.subscribeMessage(onMessage, params);
};
/**
 * Projects recorder history states onto the statistics shape so the rest of the
 * card can treat raw history exactly like an aggregated series.
 */
const historyStatesToStatistics = (history) => {
    const statistics = {};
    Object.entries(history).forEach(([entityId, states]) => {
        if (!Array.isArray(states) || !states.length) {
            statistics[entityId] = [];
            return;
        }
        const sorted = [...states].sort((a, b) => (a.lc ?? a.lu ?? 0) - (b.lc ?? b.lu ?? 0));
        const warned = new Set();
        statistics[entityId] = sorted.map((entry) => {
            const timestamp = normalizeTimestamp(entry.lc ?? entry.lu) ?? Date.now();
            const numeric = normalizeStateValue(entry.s);
            const normalizedState = entry.s.trim().toLowerCase();
            if (numeric === null &&
                !EMPTY_STATES.has(normalizedState) &&
                !warned.has(normalizedState)) {
                warned.add(normalizedState);
                log("warn", `Raw history for "${entityId}" contains the non-numeric state "${entry.s}". It is rendered as a gap.`);
            }
            const value = {
                start: timestamp,
                end: timestamp,
                change: numeric,
                sum: numeric,
                mean: numeric,
                min: numeric,
                max: numeric,
                state: numeric,
            };
            return value;
        });
    });
    return statistics;
};

const HOUR_MS$1 = 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
/**
 * Time window of the 5-minute query that backs the current-hour estimate. The
 * previous hour is included as well, because recorder may not have published
 * its aggregate yet either.
 */
const computeLiveHourWindow = (periodStart, periodEnd) => {
    const now = new Date();
    const nowMs = now.getTime();
    const currentHourStart = startOfHour(now).getTime();
    const previousHourStart = subHours(new Date(currentHourStart), 1).getTime();
    const periodStartMs = periodStart?.getTime();
    const fetchStart = Math.max(previousHourStart, periodStartMs ?? previousHourStart);
    if (nowMs <= fetchStart) {
        return undefined;
    }
    return {
        fetchStart,
        fetchEnd: nowMs,
        currentHourStart,
        previousHourStart,
        periodStartMs,
        periodEndMs: periodEnd?.getTime(),
        nowMs,
    };
};
const hourIsVisible = (hourStart, periodStartMs, periodEndMs) => {
    const hourEnd = hourStart + HOUR_MS$1;
    if (periodEndMs !== undefined && periodEndMs <= hourStart) {
        return false;
    }
    if (periodStartMs !== undefined && periodStartMs >= hourEnd) {
        return false;
    }
    return true;
};
/** Rolls up 5-minute samples into a single hourly sample. */
const aggregateToHour = (entries, hourStart, hourEnd) => {
    const relevant = entries.filter((entry) => entry.start >= hourStart && entry.start < hourEnd);
    if (!relevant.length) {
        return undefined;
    }
    let changeTotal = 0;
    let sumTotal = 0;
    let hasChange = false;
    let hasSum = false;
    let meanWeighted = 0;
    let meanWeight = 0;
    let minValue = null;
    let maxValue = null;
    let lastState = null;
    relevant.forEach((entry) => {
        const entryEnd = entry.end ?? entry.start + FIVE_MINUTES_MS;
        const duration = Math.max(0, entryEnd - entry.start);
        if (typeof entry.change === "number" && Number.isFinite(entry.change)) {
            changeTotal += entry.change;
            hasChange = true;
        }
        if (typeof entry.sum === "number" && Number.isFinite(entry.sum)) {
            sumTotal += entry.sum;
            hasSum = true;
        }
        if (typeof entry.min === "number" && Number.isFinite(entry.min)) {
            minValue = minValue === null ? entry.min : Math.min(minValue, entry.min);
        }
        if (typeof entry.max === "number" && Number.isFinite(entry.max)) {
            maxValue = maxValue === null ? entry.max : Math.max(maxValue, entry.max);
        }
        const meanCandidate = typeof entry.mean === "number" && Number.isFinite(entry.mean)
            ? entry.mean
            : typeof entry.state === "number" && Number.isFinite(entry.state)
                ? entry.state
                : undefined;
        if (meanCandidate !== undefined && duration > 0) {
            meanWeighted += meanCandidate * duration;
            meanWeight += duration;
        }
        if (typeof entry.state === "number" && Number.isFinite(entry.state)) {
            lastState = entry.state;
        }
    });
    const aggregated = { start: hourStart, end: hourEnd };
    if (hasChange) {
        aggregated.change = changeTotal;
    }
    if (hasSum) {
        aggregated.sum = sumTotal;
    }
    if (minValue !== null) {
        aggregated.min = minValue;
    }
    if (maxValue !== null) {
        aggregated.max = maxValue;
    }
    if (meanWeight > 0) {
        aggregated.mean = meanWeighted / meanWeight;
    }
    else if (lastState !== null) {
        aggregated.mean = lastState;
    }
    if (lastState !== null) {
        aggregated.state = lastState;
    }
    return aggregated;
};
/**
 * Builds hourly samples for the hours recorder has not finalized yet. Hours
 * that already have a complete aggregate are left untouched.
 */
const buildLiveHourPatch = (base, fiveMinuteStats, window, statisticIds) => {
    const hours = [];
    if (hourIsVisible(window.currentHourStart, window.periodStartMs, window.periodEndMs)) {
        hours.push(window.currentHourStart);
    }
    if (window.previousHourStart >= window.fetchStart &&
        hourIsVisible(window.previousHourStart, window.periodStartMs, window.periodEndMs)) {
        hours.push(window.previousHourStart);
    }
    if (!hours.length) {
        return undefined;
    }
    const patch = {};
    let hasValues = false;
    statisticIds.forEach((statisticId) => {
        const entries = fiveMinuteStats[statisticId] ?? [];
        const baseEntries = base[statisticId] ?? [];
        const perId = [];
        hours.forEach((hourStart) => {
            const hourEnd = Math.min(hourStart + HOUR_MS$1, window.periodEndMs ?? hourStart + HOUR_MS$1, window.nowMs);
            const existing = baseEntries.find((entry) => Math.abs(entry.start - hourStart) < 30_000);
            if (hourStart === window.currentHourStart) {
                const complete = existing && existing.end >= hourStart + 59 * 60 * 1000;
                if (complete) {
                    return;
                }
            }
            else if (existing) {
                return;
            }
            const aggregated = aggregateToHour(entries, hourStart, hourEnd);
            if (aggregated) {
                perId.push(aggregated);
            }
        });
        if (perId.length) {
            perId.sort((a, b) => a.start - b.start);
            patch[statisticId] = perId;
            hasValues = true;
        }
    });
    return hasValues ? patch : undefined;
};
/** Replaces the patched hours inside a statistics set. */
const applyLiveHourPatch = (base, patch) => {
    const updated = { ...base };
    Object.entries(patch).forEach(([statisticId, values]) => {
        if (!values?.length) {
            return;
        }
        const patchedStarts = new Set(values.map((item) => item.start));
        const existing = (updated[statisticId] ?? []).filter((entry) => !patchedStarts.has(entry.start));
        updated[statisticId] = [...existing, ...values].sort((a, b) => a.start - b.start);
    });
    return updated;
};

const POLL_INTERVAL_MS = 200;
const MAX_ATTEMPTS = 50;
/**
 * Once the picker has been declared missing it is unlikely to appear, so the
 * poll backs off from the startup rate to an idle heartbeat. It keeps watching,
 * because a picker card can still be added to the view later.
 */
const IDLE_INTERVAL_MS = 15_000;
/**
 * Compares `major.minor` numerically. A plain string comparison gets this
 * wrong the moment a minor reaches two digits ("2026.10" sorts before
 * "2026.4"), and an unknown version is treated as current.
 */
const isVersionAtLeast = (version, major, minor) => {
    const parts = String(version ?? "")
        .split(".")
        .map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(parts[0])) {
        return true;
    }
    if (parts[0] !== major) {
        return parts[0] > major;
    }
    return Number.isFinite(parts[1]) ? parts[1] >= minor : false;
};
const getCollectionKey = (hass, collectionKey) => {
    if (collectionKey) {
        return `_${collectionKey}`;
    }
    // Home Assistant 2026.4 scopes the default collection per dashboard panel.
    return isVersionAtLeast(hass.config?.version, 2026, 4)
        ? `_energy_${hass.panelUrl}`
        : "_energy";
};
const findCollection = (hass, key) => {
    const connection = hass.connection;
    const candidate = connection?.[key];
    return candidate && typeof candidate.subscribe === "function"
        ? candidate
        : undefined;
};
/**
 * Binds to the `energy-date-selection` collection of the dashboard.
 *
 * The collection is created by the date picker card, which may render after
 * this card, so the binding retries for a while. When the picker never appears,
 * `onUnavailable` lets the caller fall back to a default range.
 */
class EnergyCollectionBinding {
    constructor(_onData, _onUnavailable) {
        this._onData = _onData;
        this._onUnavailable = _onUnavailable;
        this._reportedUnavailable = false;
    }
    connect(hass, collectionKey) {
        this.disconnect();
        this._attach(hass, getCollectionKey(hass, collectionKey), 0);
    }
    disconnect() {
        if (this._pollHandle) {
            window.clearTimeout(this._pollHandle);
            this._pollHandle = undefined;
        }
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = undefined;
        }
        this._reportedUnavailable = false;
    }
    _attach(hass, key, attempt) {
        const collection = findCollection(hass, key);
        if (collection) {
            this._reportedUnavailable = false;
            this._unsubscribe = collection.subscribe((data) => this._onData(data));
            return;
        }
        if (attempt >= MAX_ATTEMPTS) {
            if (!this._reportedUnavailable) {
                this._reportedUnavailable = true;
                log("warn", "No energy date selection found on this dashboard. Falling back to the default range.");
                this._onUnavailable();
            }
            this._pollHandle = window.setTimeout(() => this._attach(hass, key, MAX_ATTEMPTS), IDLE_INTERVAL_MS);
            return;
        }
        this._pollHandle = window.setTimeout(() => this._attach(hass, key, attempt + 1), POLL_INTERVAL_MS);
    }
}

/**
 * Mirrors the interval the core energy cards pick for a given range length.
 */
const deriveAutoPeriod = (start, end) => {
    const effectiveEnd = end ?? new Date();
    const hours = Math.max(differenceInHours(effectiveEnd, start), 0);
    if (hours <= 2) {
        return "5minute";
    }
    const days = Math.max(differenceInDays(effectiveEnd, start), 0);
    if (days > 35) {
        return "month";
    }
    if (days > 2) {
        return "day";
    }
    return "hour";
};
/** Classifies a range into the button the energy date picker would have used. */
const getEnergyPickerRange = (start, end) => {
    const effectiveEnd = end ?? new Date();
    const hours = Math.max(differenceInHours(effectiveEnd, start), 0);
    const days = Math.max(differenceInDays(effectiveEnd, start), 0);
    if (hours <= 6) {
        return "hour";
    }
    if (days <= 1) {
        return "day";
    }
    if (days <= 7) {
        return "week";
    }
    if (days <= 35) {
        return "month";
    }
    return "year";
};
/**
 * Builds the ordered list of intervals to try: the configured override first,
 * then the automatic choice, then the configured fallback. Every entry after a
 * `disabled` target is dropped, because `disabled` means "do not query at all".
 *
 * An interval that would produce an absurd number of buckets for the range is
 * dropped as well. `aggregation.manual: 5minute` on a year is a plausible
 * typo and would otherwise fetch and render ~105.000 points per series, which
 * hangs the browser tab; the automatic choice takes over instead. The
 * automatic choice itself is bounded by construction and never hits this.
 */
const resolveAggregationPlan = (start, end, aggregation, usesEnergyPicker, logger) => {
    const auto = deriveAutoPeriod(start, end);
    const plan = [];
    let stopped = false;
    const push = (target) => {
        if (stopped || !target) {
            return;
        }
        if (estimateBucketCount(start, end, target) > MAX_BUCKETS) {
            logger?.warnOnce(`aggregation-too-dense-${target}`, `Aggregation "${target}" would produce far more than ${MAX_BUCKETS} points for this range and is skipped.`);
            return;
        }
        if (!plan.includes(target)) {
            plan.push(target);
        }
        if (target === "disabled") {
            stopped = true;
        }
    };
    if (usesEnergyPicker) {
        push(aggregation?.energy_picker?.[getEnergyPickerRange(start, end)]);
    }
    else {
        push(aggregation?.manual);
    }
    push(auto);
    push(aggregation?.fallback);
    return plan.length ? plan : [auto];
};

/**
 * Returns the wall-clock time of the next refresh for an interval. The offsets
 * mirror Home Assistant core: recorder needs a moment after a bucket closes
 * before the aggregate is available.
 */
const getNextRefreshTime = (aggregation) => {
    if (aggregation === "disabled") {
        return Number.POSITIVE_INFINITY;
    }
    const now = new Date();
    if (aggregation === "raw") {
        return now.getTime() + 60 * 1000;
    }
    const next = new Date(now);
    switch (aggregation) {
        case "5minute": {
            // Next 5-minute mark plus a 2 minute buffer.
            next.setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5, 0, 0);
            if (next <= now) {
                next.setMinutes(next.getMinutes() + 5);
            }
            next.setMinutes(next.getMinutes() + 2);
            return next.getTime();
        }
        case "hour": {
            next.setHours(next.getHours() + 1, 20, 0, 0);
            if (next <= now) {
                next.setHours(next.getHours() + 1);
            }
            return next.getTime();
        }
        case "day": {
            next.setDate(next.getDate() + 1);
            next.setHours(0, 30, 0, 0);
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            return next.getTime();
        }
        case "week":
        case "month":
        case "year":
        default:
            return now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000;
    }
};

const DEFAULT_STAT_TYPE = "change";
const clampValue = (value, min, max) => {
    let result = value;
    if (min !== undefined) {
        result = Math.max(result, min);
    }
    if (max !== undefined) {
        result = Math.min(result, max);
    }
    return result;
};
/** Applies `multiply`, `add` and the clip bounds in the documented order. */
const transformValue = (value, transform) => clampValue(value * (transform.multiply ?? 1) + (transform.add ?? 0), transform.clip_min, transform.clip_max);
const getSeriesSource = (series) => {
    if (series.source) {
        return series.source;
    }
    return series.calculation ? "calculation" : "statistic";
};
const getStatisticId = (series) => {
    const id = series.statistic_id?.trim();
    return id ? id : undefined;
};
/** Stable key of a calculation series inside the computed-data maps. */
const calculationKey = (index) => `calculation_${index}`;
const isCompareId = (id) => id.endsWith("--compare");
const toCompareId = (id) => `${id}--compare`;
const toBaseId = (id) => isCompareId(id) ? id.slice(0, -"--compare".length) : id;

const resolveTermValue = (term, timestamp) => {
    const direct = term.byTimestamp?.get(timestamp);
    if (direct && direct.value !== null) {
        term.lastKnown = direct;
        return direct;
    }
    const timeline = term.timeline;
    if (!timeline?.length) {
        return undefined;
    }
    // The timeline is walked once per series: timestamps are processed in
    // ascending order, so the cursor never has to move backwards.
    while (term.cursor < timeline.length && timeline[term.cursor].timestamp <= timestamp) {
        const candidate = timeline[term.cursor];
        if (candidate.value !== null) {
            term.lastKnown = candidate;
        }
        term.cursor += 1;
    }
    return term.lastKnown;
};
const buildResolvedTerms = (calculation, series, statistics, timestamps, logger, seriesLabel) => calculation.terms.map((term) => {
    const statisticId = term.statistic_id?.trim();
    if (!statisticId) {
        return {
            term,
            cursor: 0,
            constant: transformValue(term.constant ?? 0, term),
        };
    }
    const statKey = term.stat_type ?? series.stat_type ?? DEFAULT_STAT_TYPE;
    const raw = statistics[statisticId];
    const byTimestamp = new Map();
    const timeline = [];
    if (!raw?.length) {
        logger.warnOnce(`calc-missing-${seriesLabel}-${statisticId}`, `Calculation series "${seriesLabel}" references "${statisticId}" but no data was loaded. Missing values are treated as zero.`, "debug");
    }
    else {
        raw.forEach((entry) => {
            const timestamp = entry.end ?? entry.start;
            if (timestamp === undefined) {
                return;
            }
            const rawValue = entry[statKey];
            const numeric = typeof rawValue === "number" && Number.isFinite(rawValue)
                ? transformValue(rawValue, term)
                : null;
            const sample = {
                timestamp,
                value: numeric,
                start: entry.start,
                end: entry.end,
            };
            byTimestamp.set(timestamp, sample);
            timeline.push(sample);
            timestamps.add(timestamp);
        });
        timeline.sort((a, b) => a.timestamp - b.timestamp);
    }
    return {
        term,
        byTimestamp,
        timeline: timeline.length ? timeline : undefined,
        cursor: 0,
    };
});
/**
 * Synthesizes timestamps for calculations that only consist of constants, so a
 * reference line spans the whole visible range instead of collapsing to a point.
 */
const constantTimestamps = (context, statistics) => {
    if (!context.start) {
        return [];
    }
    const seen = new Set();
    const add = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            seen.add(value);
        }
    };
    const startTs = context.start.getTime();
    const endTs = context.end?.getTime();
    add(startTs);
    add(endTs);
    if (context.period && context.end) {
        buildBucketSequence(startTs, context.end.getTime(), context.period)?.forEach(add);
    }
    Object.values(statistics).forEach((entries) => {
        entries?.forEach((entry) => {
            add(entry.start);
            add(entry.end);
        });
    });
    if (seen.size === 1 && endTs === undefined) {
        add(startTs + 1);
    }
    return Array.from(seen).sort((a, b) => a - b);
};
/**
 * Evaluates a calculation series into statistics-shaped samples.
 *
 * Terms are applied sequentially starting from `initial_value`. Every statistic
 * bucket contributed by any term becomes one output point; terms that have no
 * sample at that exact timestamp reuse their last known value (and count as
 * zero until they have one).
 */
const evaluateCalculation = (series, calculation, statistics, seriesIndex, context, logger) => {
    if (!calculation.terms?.length) {
        return undefined;
    }
    const seriesLabel = series.name ?? series.statistic_id ?? `series_${seriesIndex}`;
    const timestampSet = new Set();
    const terms = buildResolvedTerms(calculation, series, statistics, timestampSet, logger, seriesLabel);
    const timestamps = Array.from(timestampSet).sort((a, b) => a - b);
    const constantOnly = !timestamps.length && terms.every((item) => item.constant !== undefined);
    if (!timestamps.length && !constantOnly) {
        return undefined;
    }
    const initialValue = calculation.initial_value ?? 0;
    const values = [];
    const evaluateTimestamp = (timestamp) => {
        let total = initialValue;
        let start;
        let end;
        let valid = true;
        for (const item of terms) {
            if (!valid) {
                break;
            }
            let termValue;
            if (item.constant !== undefined) {
                termValue = item.constant;
            }
            else {
                const resolved = resolveTermValue(item, timestamp);
                if (resolved && resolved.value !== null) {
                    start = start ?? resolved.start ?? timestamp;
                    end = end ?? resolved.end ?? timestamp;
                    termValue = resolved.value;
                }
                else {
                    termValue = 0;
                    logger.warnOnce(`calc-value-${seriesLabel}-${item.term.statistic_id}`, `Missing value for "${item.term.statistic_id}" in calculation series "${seriesLabel}". Using 0.`, "debug");
                }
            }
            switch (item.term.operation ?? "add") {
                case "subtract":
                    total -= termValue;
                    break;
                case "multiply":
                    total *= termValue;
                    break;
                case "divide":
                    if (termValue === 0) {
                        valid = false;
                        logger.warnOnce(`calc-div0-${seriesLabel}`, `Division by zero in calculation series "${seriesLabel}". Affected points are rendered as gaps.`);
                    }
                    else {
                        total /= termValue;
                    }
                    break;
                case "add":
                default:
                    total += termValue;
                    break;
            }
        }
        const numericTotal = valid && Number.isFinite(total) ? total : null;
        values.push({
            start: start ?? timestamp,
            end: end ?? timestamp,
            change: numericTotal,
            sum: numericTotal,
            mean: numericTotal,
            min: numericTotal,
            max: numericTotal,
            state: numericTotal,
        });
    };
    if (timestamps.length) {
        timestamps.forEach(evaluateTimestamp);
    }
    else {
        constantTimestamps(context, statistics).forEach(evaluateTimestamp);
    }
    return { values };
};

const UNITS = ["hour", "day", "week", "month", "year"];
/** Ignores incomplete or zero offsets so they behave like "no offset". */
const normalizeTimeOffset = (offset) => {
    if (!offset) {
        return undefined;
    }
    if (!Number.isInteger(offset.value) || offset.value === 0) {
        return undefined;
    }
    if (!UNITS.includes(offset.unit)) {
        return undefined;
    }
    return { value: offset.value, unit: offset.unit };
};
const getSeriesTimeOffset = (series) => normalizeTimeOffset(series.time_offset);
/** `direction: 1` moves into the source range, `-1` back into the display range. */
const shiftDate = (date, offset, direction) => {
    const amount = offset.value * direction;
    switch (offset.unit) {
        case "hour":
            return addHours(date, amount);
        case "day":
            return addDays(date, amount);
        case "week":
            return addWeeks(date, amount);
        case "month":
            return addMonths(date, amount);
        case "year":
            return addYears(date, amount);
        default:
            return date;
    }
};
const shiftTimestamp = (timestamp, offset, direction) => shiftDate(new Date(timestamp), offset, direction).getTime();
/** Projects source-range samples back onto the visible range. */
const shiftStatisticValues = (values, offset) => values.map((entry) => ({
    ...entry,
    start: shiftTimestamp(entry.start, offset, -1),
    end: shiftTimestamp(entry.end, offset, -1),
}));
/** Statistic id used for the shifted copy of a series inside the chart model. */
const shiftedStatisticId = (index, statisticId) => `__time_offset_${index}__${statisticId}`;

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}
const withTimeout = (promise, timeoutMs, context) => {
    let handle;
    const timeout = new Promise((_, reject) => {
        handle = window.setTimeout(() => reject(new TimeoutError(`${context} timed out after ${timeoutMs} ms`)), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (handle !== undefined) {
            window.clearTimeout(handle);
        }
    });
};
const DEFAULT_DELAY_MS = 500;
/**
 * Debounces and serializes the loads of one target.
 *
 * While a request is running, further requests are collapsed into a single
 * queued rerun. While the dashboard is hidden, requests are parked and replayed
 * once it becomes visible again.
 */
class FetchQueue {
    constructor(_isActive, _run) {
        this._isActive = _isActive;
        this._run = _run;
        this._entries = new Map();
        this._parked = new Set();
    }
    schedule(key, delayMs = DEFAULT_DELAY_MS) {
        const entry = this._entry(key);
        if (!this._isActive()) {
            this._clearTimer(entry);
            entry.queued = true;
            entry.queuedDelay = delayMs;
            this._parked.add(key);
            return;
        }
        if (entry.inFlight) {
            this._clearTimer(entry);
            entry.queued = true;
            // The rerun keeps the delay it was asked for. A retry scheduled from
            // inside a failing run would otherwise collapse onto the default and
            // hammer a recorder that is already not answering, and a range change
            // arriving later would still get its own, shorter delay back.
            entry.queuedDelay = delayMs;
            return;
        }
        this._clearTimer(entry);
        entry.timeout = window.setTimeout(() => {
            entry.timeout = undefined;
            if (!this._isActive()) {
                entry.queued = true;
                this._parked.add(key);
                return;
            }
            void this._execute(key, entry);
        }, delayMs);
    }
    isRunning(key) {
        return this._entry(key).inFlight;
    }
    /** Keys that were requested while the queue was inactive. */
    takeParked() {
        const parked = Array.from(this._parked);
        this._parked.clear();
        return parked;
    }
    pause() {
        this._entries.forEach((entry) => this._clearTimer(entry));
    }
    dispose() {
        this._entries.forEach((entry) => {
            this._clearTimer(entry);
            entry.inFlight = false;
            entry.queued = false;
            entry.queuedDelay = undefined;
        });
        this._parked.clear();
    }
    async _execute(key, entry) {
        entry.inFlight = true;
        entry.queued = false;
        entry.queuedDelay = undefined;
        try {
            await this._run(key);
        }
        finally {
            entry.inFlight = false;
            if (entry.queued) {
                const delay = entry.queuedDelay;
                entry.queued = false;
                entry.queuedDelay = undefined;
                this.schedule(key, delay);
            }
        }
    }
    _entry(key) {
        let entry = this._entries.get(key);
        if (!entry) {
            entry = { inFlight: false, queued: false };
            this._entries.set(key, entry);
        }
        return entry;
    }
    _clearTimer(entry) {
        if (entry.timeout) {
            window.clearTimeout(entry.timeout);
            entry.timeout = undefined;
        }
    }
}

const FETCH_TIMEOUT_MS = 60_000;
const RAW_DELTA_OVERLAP_MS = 60_000;
const VISIBILITY_RESUME_DELAY_MS = 200;
const LIVE_HOUR_MIN_DELAY_MS = 30_000;
/**
 * Backoff for a load that failed outright. Without it the next attempt would
 * be the regular refresh, which for hourly data is up to an hour away - far
 * too long to sit on a blank card because of one websocket hiccup.
 */
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000];
const emptyTargetState = () => ({
    metadata: {},
    calculated: new Map(),
});
/**
 * Owns all data acquisition for the card: it resolves the visible range, keeps
 * it in sync with the energy date picker, loads statistics or raw history at
 * the right aggregation, evaluates calculation series and keeps everything
 * refreshed. The card itself only renders the resulting snapshot.
 */
class GraphDataController {
    constructor(_onChange) {
        this._onChange = _onChange;
        this._energyFallbackActive = false;
        this._main = emptyTargetState();
        this._compare = emptyTargetState();
        this._shiftedStatistics = new Map();
        this._shiftedMetadata = new Map();
        this._shiftedCalculated = new Map();
        this._statisticIds = [];
        this._statTypes = [];
        this._isLoading = false;
        /** Per-target request counter; only the newest response may write state. */
        this._generations = { main: 0, compare: 0 };
        /** Consecutive failures per target, which pick the backoff delay. */
        this._failures = { main: 0, compare: 0 };
        this._connected = false;
        this._visible = typeof document === "undefined" || document.visibilityState !== "hidden";
        this._logger = new OnceLogger();
        // ---------------------------------------------------------------- visibility
        this._handleVisibilityChange = () => {
            const visible = document.visibilityState !== "hidden";
            if (visible === this._visible) {
                return;
            }
            this._visible = visible;
            if (!visible) {
                this._queue.pause();
                this._clearTimer("_autoRefreshTimeout");
                this._clearTimer("_liveHourTimeout");
                void this._teardownRawStream();
                return;
            }
            this._clearTimer("_visibilityResumeTimeout");
            this._visibilityResumeTimeout = window.setTimeout(() => {
                this._visibilityResumeTimeout = undefined;
                if (!this._visible) {
                    return;
                }
                const parked = new Set(this._queue.takeParked());
                parked.add("main");
                if (this._comparePeriodStart) {
                    parked.add("compare");
                }
                parked.forEach((key) => this._queue.schedule(key));
                this._scheduleAutoRefresh();
            }, VISIBILITY_RESUME_DELAY_MS);
        };
        this._queue = new FetchQueue(() => this._connected && this._visible, (key) => this._runFetch(key));
        this._energyBinding = new EnergyCollectionBinding((data) => this._onEnergyRange(data), () => this._onEnergyUnavailable());
    }
    // ---------------------------------------------------------------- lifecycle
    connect() {
        if (this._connected) {
            return;
        }
        // Statistics survive a detach, but the queue, every timer and the raw
        // stream do not - they are only ever (re)armed at the end of a load.
        // `_sync` schedules nothing when neither range nor series changed, so a
        // re-attached card would sit on frozen data forever. Loading once puts all
        // of that back in place, and refreshes what went stale while detached.
        const reattached = !!this._main.statistics;
        this._connected = true;
        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", this._handleVisibilityChange);
            this._visible = document.visibilityState !== "hidden";
        }
        this._sync();
        if (reattached) {
            this._queue.schedule("main");
            if (this._comparePeriodStart) {
                this._queue.schedule("compare");
            }
        }
    }
    disconnect() {
        this._connected = false;
        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this._handleVisibilityChange);
        }
        this._energyBinding.disconnect();
        this._queue.dispose();
        this._clearTimer("_autoRefreshTimeout");
        this._clearTimer("_liveHourTimeout");
        this._clearTimer("_visibilityResumeTimeout");
        void this._teardownRawStream();
    }
    setHass(hass) {
        const first = !this._hass;
        this._hass = hass;
        if (first && this._connected) {
            this._sync();
        }
    }
    setConfig(config) {
        const previous = this._config;
        this._config = config;
        this._logger.reset();
        if (previous && !config.aggregation?.compute_current_hour) {
            this._clearTimer("_liveHourTimeout");
        }
        if (this._connected) {
            this._sync(previous);
        }
    }
    get snapshot() {
        return {
            loading: this._isLoading,
            aggregationDisabled: this._main.aggregation === "disabled",
            periodStart: this._periodStart,
            periodEnd: this._periodEnd,
            comparePeriodStart: this._comparePeriodStart,
            comparePeriodEnd: this._comparePeriodEnd,
            main: this._main,
            compare: this._compare,
            shiftedStatistics: this._shiftedStatistics,
            shiftedMetadata: this._shiftedMetadata,
            shiftedCalculated: this._shiftedCalculated,
        };
    }
    // ------------------------------------------------------------ configuration
    get _timespan() {
        return this._config?.timespan ?? DEFAULT_TIMESPAN;
    }
    get _usesEnergyPicker() {
        return this._timespan.mode === "energy";
    }
    _hasTimeOffsets(config = this._config) {
        return Boolean(config?.series.some((series) => getSeriesTimeOffset(series)));
    }
    /** Compare is only available through the energy date picker's compare toggle. */
    _shouldUseCompare() {
        if (!this._usesEnergyPicker || !this._config) {
            return false;
        }
        if (this._hasTimeOffsets()) {
            return false;
        }
        return this._config.allow_compare !== false;
    }
    _sync(previousConfig) {
        if (!this._hass || !this._config) {
            return;
        }
        const needsPicker = this._usesEnergyPicker;
        const modeChanged = previousConfig?.timespan?.mode !== this._timespan.mode;
        const keyChanged = previousConfig?.collection_key !== this._config.collection_key;
        if (needsPicker && (modeChanged || keyChanged || !previousConfig)) {
            this._energyBinding.connect(this._hass, this._config.collection_key);
        }
        else if (!needsPicker && previousConfig?.timespan?.mode === "energy") {
            this._energyBinding.disconnect();
            this._energyRange = undefined;
            this._energyCompareRange = undefined;
        }
        if (!this._shouldUseCompare()) {
            this._clearCompare();
        }
        const periodChanged = this._recalculatePeriod();
        const compareChanged = this._recalculateComparePeriod();
        const seriesChanged = !!previousConfig &&
            JSON.stringify(previousConfig.series) !== JSON.stringify(this._config.series);
        if (periodChanged || seriesChanged) {
            void this._teardownRawStream();
            this._clearShifted();
        }
        if (periodChanged || seriesChanged || !this._main.statistics) {
            this._queue.schedule("main");
        }
        if (this._comparePeriodStart &&
            (compareChanged || seriesChanged || !this._compare.statistics)) {
            this._queue.schedule("compare");
        }
    }
    // ------------------------------------------------------------------ periods
    _onEnergyRange(data) {
        this._energyFallbackActive = false;
        this._energyRange = { start: data.start, end: data.end };
        if (this._shouldUseCompare() && data.startCompare) {
            this._energyCompareRange = {
                start: data.startCompare,
                end: data.endCompare,
            };
        }
        else {
            this._energyCompareRange = undefined;
        }
        const periodChanged = this._recalculatePeriod();
        const compareChanged = this._recalculateComparePeriod();
        if (periodChanged || !this._main.statistics) {
            this._queue.schedule("main");
        }
        if (this._comparePeriodStart &&
            (compareChanged || !this._compare.statistics)) {
            this._queue.schedule("compare");
        }
    }
    _onEnergyUnavailable() {
        this._energyFallbackActive = true;
        if (this._recalculatePeriod() || !this._main.statistics) {
            this._queue.schedule("main");
        }
    }
    _resolveRange() {
        const energyRange = this._energyRange ?? (this._energyFallbackActive ? todayRange() : undefined);
        try {
            return resolveTimespan(this._timespan, energyRange);
        }
        catch (error) {
            log("error", "Invalid timespan configuration", {
                error: error instanceof Error ? error.message : error,
            });
            return undefined;
        }
    }
    _recalculatePeriod() {
        const resolved = this._resolveRange();
        if (!resolved) {
            return false;
        }
        const changed = this._periodStart?.getTime() !== resolved.start.getTime() ||
            this._periodEnd?.getTime() !== resolved.end?.getTime();
        if (changed) {
            this._periodStart = resolved.start;
            this._periodEnd = resolved.end;
            this._main.lastRawEnd = undefined;
            // A new range is a fresh start, not a continuation of a failing one.
            this._failures.main = 0;
        }
        return changed;
    }
    _recalculateComparePeriod() {
        const range = this._shouldUseCompare() ? this._energyCompareRange : undefined;
        if (!range) {
            if (this._comparePeriodStart || this._comparePeriodEnd) {
                this._clearCompare();
                return true;
            }
            return false;
        }
        const changed = this._comparePeriodStart?.getTime() !== range.start.getTime() ||
            this._comparePeriodEnd?.getTime() !== range.end?.getTime();
        if (changed) {
            this._comparePeriodStart = range.start;
            this._comparePeriodEnd = range.end;
            this._compare = emptyTargetState();
            this._failures.compare = 0;
        }
        return changed;
    }
    _clearCompare() {
        this._comparePeriodStart = undefined;
        this._comparePeriodEnd = undefined;
        this._compare = emptyTargetState();
    }
    _clearShifted() {
        this._shiftedStatistics = new Map();
        this._shiftedMetadata = new Map();
        this._shiftedCalculated = new Map();
    }
    // ------------------------------------------------------------------ loading
    _collectStatisticRequests() {
        const ids = new Set();
        const types = new Set();
        this._config?.series.forEach((series) => {
            const defaultStatType = series.stat_type ?? DEFAULT_STAT_TYPE;
            if (getSeriesTimeOffset(series)) {
                // Loaded separately from a shifted source range.
                return;
            }
            if (getSeriesSource(series) === "statistic") {
                const id = getStatisticId(series);
                if (id) {
                    ids.add(id);
                    types.add(defaultStatType);
                }
                return;
            }
            series.calculation?.terms?.forEach((term) => {
                const id = term.statistic_id?.trim();
                if (id) {
                    ids.add(id);
                    types.add(term.stat_type ?? defaultStatType);
                }
            });
        });
        return {
            ids: Array.from(ids),
            types: types.size ? Array.from(types) : [DEFAULT_STAT_TYPE],
        };
    }
    /**
     * Whether a response may still write state. A newer request supersedes an
     * older one, and a detached card must not be revived by a late answer: every
     * `await` in a load is a point at which the card can have gone away, and the
     * tail of a load arms timers and the raw stream that nobody would clean up.
     */
    _isCurrent(target, generation) {
        return this._connected && generation === this._generations[target];
    }
    async _runFetch(key) {
        if (key === "live") {
            await this._loadLiveHour();
            return;
        }
        await this._loadStatistics(key === "compare");
    }
    async _loadStatistics(isCompare) {
        const hass = this._hass;
        const config = this._config;
        const periodStart = isCompare ? this._comparePeriodStart : this._periodStart;
        const periodEnd = isCompare ? this._comparePeriodEnd : this._periodEnd;
        if (!hass || !config || !periodStart || !this._visible) {
            return;
        }
        const target = isCompare ? this._compare : this._main;
        const range = {
            start: periodStart.getTime(),
            end: periodEnd?.getTime() ?? null,
        };
        const { ids, types } = this._collectStatisticRequests();
        if (!isCompare) {
            this._statisticIds = ids;
            this._statTypes = types;
        }
        const plan = resolveAggregationPlan(periodStart, periodEnd, config.aggregation, this._usesEnergyPicker, this._logger);
        const targetKey = isCompare ? "compare" : "main";
        if (plan[0] === "disabled") {
            this._generations[targetKey] += 1;
            this._applyDisabled(isCompare, range);
            return;
        }
        const generation = ++this._generations[targetKey];
        const showLoader = !isCompare && !this._main.statistics;
        if (showLoader) {
            this._isLoading = true;
            this._onChange();
        }
        try {
            const metadata = await this._loadMetadata(hass, ids);
            const result = await this._fetchWithPlan(hass, plan, periodStart, periodEnd, ids, types, isCompare, range);
            if (!this._isCurrent(targetKey, generation)) {
                return;
            }
            // Every request threw. The recorder did not say "no data" - it said
            // nothing at all, so the last good data stays on screen and the load is
            // retried rather than the card going blank until the next refresh.
            if (result.failed) {
                this._scheduleRetry(targetKey);
                return;
            }
            this._failures[targetKey] = 0;
            target.metadata = metadata;
            target.range = range;
            target.aggregation = result.aggregation;
            if (result.aggregation === "raw") {
                const merged = result.incremental && target.statistics
                    ? mergeStatistics(target.statistics, result.statistics)
                    : result.statistics;
                target.statistics = trimStatisticsToRange(merged, range.start, range.end);
                target.lastRawEnd = maxStatisticsEnd(target.statistics);
            }
            else {
                target.statistics = result.statistics;
                target.lastRawEnd = undefined;
            }
            this._rebuildCalculations(isCompare);
            if (!isCompare) {
                if (result.aggregation === "raw") {
                    void this._restartRawStream();
                }
                else {
                    void this._teardownRawStream();
                }
                await this._loadShiftedSeries(periodStart, periodEnd, generation);
                if (!this._isCurrent("main", generation)) {
                    return;
                }
                this._scheduleAutoRefresh();
                this._scheduleLiveHour();
            }
        }
        catch (error) {
            if (this._isCurrent(targetKey, generation)) {
                log("error", "Failed to load statistics", {
                    compare: isCompare,
                    error: error instanceof Error ? error.message : error,
                });
                // Whatever is on screen is older than intended but still real data,
                // which beats an empty card. It is replaced once a load succeeds.
                this._scheduleRetry(targetKey);
            }
        }
        finally {
            if (generation === this._generations[targetKey] && showLoader) {
                this._isLoading = false;
            }
            if (this._connected) {
                this._onChange();
            }
        }
    }
    /** Re-runs a failed load, backing off over consecutive failures. */
    _scheduleRetry(target) {
        const attempt = Math.min(this._failures[target], RETRY_DELAYS_MS.length - 1);
        this._failures[target] = this._failures[target] + 1;
        this._queue.schedule(target, RETRY_DELAYS_MS[attempt]);
    }
    _applyDisabled(isCompare, range) {
        const target = emptyTargetState();
        target.range = range;
        target.aggregation = "disabled";
        if (isCompare) {
            this._compare = target;
        }
        else {
            this._main = target;
            this._clearShifted();
            this._clearTimer("_autoRefreshTimeout");
            this._clearTimer("_liveHourTimeout");
        }
        this._isLoading = false;
        this._onChange();
    }
    async _loadMetadata(hass, ids) {
        if (!ids.length) {
            return {};
        }
        try {
            const entries = await withTimeout(fetchStatisticsMetadata(hass, ids), FETCH_TIMEOUT_MS, "getStatisticsMetadata");
            const metadata = {};
            entries.forEach((item) => {
                metadata[item.statistic_id] = item;
            });
            return metadata;
        }
        catch (error) {
            if (!(error instanceof TimeoutError)) {
                log("warn", "Failed to load statistics metadata", {
                    error: error instanceof Error ? error.message : error,
                });
            }
            return {};
        }
    }
    /**
     * Walks the aggregation plan until one interval returns data. Every step is
     * tried once; the last attempted interval is reported even when it was empty.
     *
     * `failed` separates the two ways this can come back without data: the
     * recorder genuinely has none for the range, or every request threw. Only the
     * caller can act on that difference, and it must - overwriting good data with
     * the empty result of a failed request is what blanks the card.
     */
    async _fetchWithPlan(hass, plan, start, end, ids, types, isCompare, range) {
        if (!ids.length) {
            return {
                statistics: {},
                aggregation: plan[0],
                incremental: false,
                failed: false,
            };
        }
        let statistics = {};
        let lastAggregation = plan[0];
        let incremental = false;
        let attempts = 0;
        let errors = 0;
        for (let idx = 0; idx < plan.length; idx++) {
            const aggregation = plan[idx];
            lastAggregation = aggregation;
            if (aggregation === "disabled") {
                return {
                    statistics: {},
                    aggregation,
                    incremental: false,
                    failed: false,
                };
            }
            attempts += 1;
            try {
                if (aggregation === "raw") {
                    const target = isCompare ? this._compare : this._main;
                    const lastEnd = target.lastRawEnd;
                    const from = lastEnd !== undefined && (range.end === null || lastEnd < range.end)
                        ? new Date(Math.max(start.getTime(), lastEnd - RAW_DELTA_OVERLAP_MS))
                        : start;
                    incremental = from !== start;
                    statistics = await this._fetchRawStatistics(hass, from, end, ids);
                }
                else {
                    statistics = await withTimeout(fetchStatistics(hass, start, end, ids, aggregation, types), FETCH_TIMEOUT_MS, `fetchStatistics:${aggregation}`);
                    incremental = false;
                }
                if (statisticsHaveData(statistics, ids)) {
                    return { statistics, aggregation, incremental, failed: false };
                }
                if (idx < plan.length - 1) {
                    log("warn", `Aggregation "${aggregation}" returned no data. Trying "${plan[idx + 1]}".`);
                }
            }
            catch (error) {
                errors += 1;
                log("error", `Failed to load statistics for aggregation "${aggregation}"`, {
                    error: error instanceof Error ? error.message : error,
                });
            }
        }
        return {
            statistics,
            aggregation: lastAggregation,
            incremental,
            failed: attempts > 0 && errors === attempts,
        };
    }
    async _fetchRawStatistics(hass, start, end, ids) {
        // Query slightly beyond the visible range so lines reach both edges.
        const buffer = end
            ? Math.max(60_000, (end.getTime() - start.getTime()) * 0.1)
            : 60_000;
        const queryStart = new Date(start.getTime() - buffer);
        const queryEnd = end ? new Date(end.getTime() + buffer) : undefined;
        const history = await withTimeout(fetchRawHistoryStates(hass, queryStart, queryEnd, ids, this._config?.aggregation?.raw_options), FETCH_TIMEOUT_MS, "fetchRawHistoryStates");
        return historyStatesToStatistics(history);
    }
    // ------------------------------------------------------ time offset series
    _buildShiftedGroups(start, end) {
        const groups = new Map();
        this._config?.series.forEach((series, index) => {
            const offset = getSeriesTimeOffset(series);
            if (!offset) {
                return;
            }
            const source = getSeriesSource(series);
            const statisticId = getStatisticId(series);
            if (source === "statistic" && !statisticId) {
                return;
            }
            if (source === "calculation" && !series.calculation?.terms?.length) {
                return;
            }
            const sourceStart = shiftDate(start, offset, 1);
            const sourceEnd = end ? shiftDate(end, offset, 1) : undefined;
            const key = `${offset.value}:${offset.unit}`;
            const group = groups.get(key) ?? {
                key,
                sourceStart,
                sourceEnd,
                offset,
                statisticSeries: [],
                calculationSeries: [],
            };
            if (source === "statistic" && statisticId) {
                group.statisticSeries.push({ index, statisticId });
            }
            else {
                group.calculationSeries.push({ index, series });
            }
            groups.set(key, group);
        });
        return Array.from(groups.values());
    }
    _shiftedGroupRequests(group) {
        const ids = new Set();
        const types = new Set();
        group.statisticSeries.forEach(({ index, statisticId }) => {
            ids.add(statisticId);
            types.add(this._config?.series[index].stat_type ?? DEFAULT_STAT_TYPE);
        });
        group.calculationSeries.forEach(({ series }) => {
            const defaultStatType = series.stat_type ?? DEFAULT_STAT_TYPE;
            series.calculation?.terms?.forEach((term) => {
                const id = term.statistic_id?.trim();
                if (id) {
                    ids.add(id);
                    types.add(term.stat_type ?? defaultStatType);
                }
            });
        });
        return {
            ids: Array.from(ids),
            types: types.size ? Array.from(types) : [DEFAULT_STAT_TYPE],
        };
    }
    /**
     * Loads every series that configures `time_offset` from its shifted source
     * range and projects the samples back onto the visible range.
     */
    async _loadShiftedSeries(start, end, generation) {
        const hass = this._hass;
        const groups = hass ? this._buildShiftedGroups(start, end) : [];
        if (!hass || !groups.length) {
            this._clearShifted();
            return;
        }
        const statisticsByIndex = new Map();
        const metadataByIndex = new Map();
        const calculatedByKey = new Map();
        for (const group of groups) {
            const { ids, types } = this._shiftedGroupRequests(group);
            const plan = resolveAggregationPlan(group.sourceStart, group.sourceEnd, this._config?.aggregation, this._usesEnergyPicker, this._logger).filter((aggregation) => aggregation !== "raw");
            if (!plan.length || plan[0] === "disabled") {
                this._logger.warnOnce(`shifted-unsupported-${group.key}`, "Series time offset requires aggregated statistics; raw history and disabled ranges are skipped.");
                continue;
            }
            const metadata = await this._loadMetadata(hass, ids);
            const result = await this._fetchWithPlan(hass, plan, group.sourceStart, group.sourceEnd, ids, types, false, { start: group.sourceStart.getTime(), end: group.sourceEnd?.getTime() ?? null });
            if (!this._isCurrent("main", generation)) {
                return;
            }
            if (result.aggregation === "disabled") {
                continue;
            }
            group.statisticSeries.forEach(({ index, statisticId }) => {
                const values = result.statistics[statisticId];
                if (!values?.length) {
                    return;
                }
                statisticsByIndex.set(index, shiftStatisticValues(values, group.offset));
                metadataByIndex.set(index, metadata[statisticId]);
            });
            group.calculationSeries.forEach(({ index, series }) => {
                const evaluated = evaluateCalculation(series, series.calculation, result.statistics, index, {
                    start: group.sourceStart,
                    end: group.sourceEnd,
                    period: result.aggregation,
                }, this._logger);
                if (!evaluated?.values.length) {
                    return;
                }
                calculatedByKey.set(calculationKey(index), shiftStatisticValues(evaluated.values, group.offset));
            });
        }
        this._shiftedStatistics = statisticsByIndex;
        this._shiftedMetadata = metadataByIndex;
        this._shiftedCalculated = calculatedByKey;
    }
    // ------------------------------------------------------------- calculations
    _rebuildCalculations(isCompare) {
        const target = isCompare ? this._compare : this._main;
        const calculated = new Map();
        this._config?.series.forEach((series, index) => {
            if (!series.calculation || getSeriesSource(series) !== "calculation") {
                return;
            }
            // Offset calculations are evaluated on their shifted source range.
            if (!isCompare && getSeriesTimeOffset(series)) {
                return;
            }
            const result = evaluateCalculation(series, series.calculation, target.statistics ?? {}, index, {
                start: isCompare ? this._comparePeriodStart : this._periodStart,
                end: isCompare ? this._comparePeriodEnd : this._periodEnd,
                period: target.aggregation,
            }, this._logger);
            if (result) {
                calculated.set(calculationKey(index), result.values);
            }
        });
        target.calculated = calculated;
    }
    // --------------------------------------------------------------- raw stream
    _shouldUseRawStream() {
        return (this._connected &&
            this._visible &&
            !!this._hass &&
            this._main.aggregation === "raw" &&
            this._statisticIds.length > 0);
    }
    async _restartRawStream() {
        await this._teardownRawStream();
        if (!this._shouldUseRawStream() || !this._hass) {
            return;
        }
        const fallbackStart = this._main.range?.start ?? Date.now();
        const startMs = this._main.lastRawEnd !== undefined
            ? Math.max(this._main.lastRawEnd - RAW_DELTA_OVERLAP_MS, fallbackStart)
            : fallbackStart;
        this._rawStreamUnsub = subscribeRawHistoryStream(this._hass, new Date(startMs), this._statisticIds, (message) => {
            if (message?.states && Object.keys(message.states).length) {
                this._applyRawStreamStates(message.states);
            }
        }, this._config?.aggregation?.raw_options).catch((error) => {
            log("error", "Failed to subscribe to the raw history stream", {
                error: error instanceof Error ? error.message : error,
            });
            this._rawStreamUnsub = undefined;
            this._queue.schedule("main");
            return undefined;
        });
    }
    async _teardownRawStream() {
        const handle = this._rawStreamUnsub;
        this._rawStreamUnsub = undefined;
        if (!handle) {
            return;
        }
        try {
            const unsubscribe = await handle;
            if (typeof unsubscribe === "function") {
                await unsubscribe();
            }
        }
        catch (error) {
            log("warn", "Failed to unsubscribe from the raw history stream", {
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    _applyRawStreamStates(states) {
        if (!this._shouldUseRawStream()) {
            return;
        }
        const patch = historyStatesToStatistics(states);
        if (!Object.values(patch).some((entries) => entries?.length)) {
            return;
        }
        const range = this._main.range;
        const merged = mergeStatistics(this._main.statistics, patch);
        this._main.statistics = range
            ? trimStatisticsToRange(merged, range.start, range.end)
            : merged;
        this._main.lastRawEnd = maxStatisticsEnd(this._main.statistics);
        this._rebuildCalculations(false);
        this._onChange();
    }
    /** Re-trims a streaming range after a rolling window has moved on. */
    _applyRollingWindowShift() {
        if (!this._main.statistics || !this._periodStart) {
            return;
        }
        const range = {
            start: this._periodStart.getTime(),
            end: this._periodEnd?.getTime() ?? null,
        };
        this._main.statistics = trimStatisticsToRange(this._main.statistics, range.start, range.end);
        this._main.range = range;
        this._main.lastRawEnd = maxStatisticsEnd(this._main.statistics);
        this._rebuildCalculations(false);
        this._onChange();
    }
    // ------------------------------------------------------------ current hour
    _shouldComputeCurrentHour() {
        if (!this._config?.aggregation?.compute_current_hour) {
            return false;
        }
        if (this._main.aggregation !== "hour" || !this._periodStart) {
            return false;
        }
        const now = new Date();
        if (this._periodStart > now) {
            return false;
        }
        return !this._periodEnd || this._periodEnd > startOfHour(now);
    }
    _scheduleLiveHour() {
        this._clearTimer("_liveHourTimeout");
        if (!this._shouldComputeCurrentHour()) {
            return;
        }
        this._queue.schedule("live", 250);
        const delay = Math.max(getNextRefreshTime("5minute") - Date.now(), LIVE_HOUR_MIN_DELAY_MS);
        this._liveHourTimeout = window.setTimeout(() => {
            this._liveHourTimeout = undefined;
            this._scheduleLiveHour();
        }, delay);
    }
    /**
     * Estimates the ongoing hour from 5-minute statistics until Home Assistant
     * publishes the official hourly aggregate.
     */
    async _loadLiveHour() {
        const hass = this._hass;
        if (!hass || !this._connected || !this._visible || !this._shouldComputeCurrentHour()) {
            return;
        }
        const base = this._main.statistics;
        if (!base || !this._statisticIds.length) {
            return;
        }
        const window = computeLiveHourWindow(this._periodStart, this._periodEnd);
        if (!window) {
            return;
        }
        try {
            const fiveMinute = await withTimeout(fetchStatistics(hass, new Date(window.fetchStart), new Date(window.fetchEnd), this._statisticIds, "5minute", this._statTypes), FETCH_TIMEOUT_MS, "fetchStatistics:liveHour");
            const patch = buildLiveHourPatch(base, fiveMinute, window, this._statisticIds);
            if (!patch) {
                return;
            }
            this._main.statistics = applyLiveHourPatch(base, patch);
            this._rebuildCalculations(false);
            this._onChange();
        }
        catch (error) {
            log("error", "Failed to load the current-hour estimate", {
                error: error instanceof Error ? error.message : error,
            });
        }
    }
    // ------------------------------------------------------------- auto refresh
    _scheduleAutoRefresh() {
        this._clearTimer("_autoRefreshTimeout");
        if (!this._connected || !this._visible || !this._config || !this._periodStart) {
            return;
        }
        const timespan = this._timespan;
        if (timespan.mode === "fixed") {
            const end = timespan.end ? new Date(timespan.end) : null;
            if (!end || end <= new Date()) {
                return; // Historical data does not change.
            }
        }
        const aggregation = this._main.aggregation ?? "hour";
        if (aggregation === "disabled") {
            return;
        }
        const delay = getNextRefreshTime(aggregation) - Date.now();
        if (!Number.isFinite(delay)) {
            return;
        }
        this._autoRefreshTimeout = window.setTimeout(() => {
            this._autoRefreshTimeout = undefined;
            this._runAutoRefresh(aggregation);
        }, Math.max(delay, 60_000));
    }
    _runAutoRefresh(aggregation) {
        if (!this._connected || !this._visible) {
            return;
        }
        const periodChanged = this._recalculatePeriod();
        const compareChanged = this._recalculateComparePeriod();
        const rolling = isRollingTimespan(this._timespan);
        let refreshMain = rolling ? periodChanged : true;
        // A live raw stream already delivers new samples; only the window moves.
        if (aggregation === "raw" && this._rawStreamUnsub) {
            if (periodChanged) {
                this._applyRollingWindowShift();
            }
            refreshMain = false;
        }
        if (refreshMain) {
            this._queue.schedule("main");
        }
        if (this._comparePeriodStart && (compareChanged || refreshMain)) {
            this._queue.schedule("compare");
        }
        this._scheduleAutoRefresh();
    }
    _clearTimer(field) {
        const handle = this[field];
        if (handle) {
            window.clearTimeout(handle);
            this[field] = undefined;
        }
    }
}

const getFormatterContext = (hass) => {
    const locale = hass?.locale?.language ?? "en-US";
    const localeInfo = hass?.locale;
    let timeZone = localeInfo?.time_zone;
    if (timeZone === "server") {
        timeZone = hass?.config?.time_zone;
    }
    if (!timeZone || timeZone === "local" || timeZone === "system") {
        timeZone = undefined;
    }
    return { locale, timeZone };
};
const formatNumber = (value, hass, options) => new Intl.NumberFormat(hass?.locale?.language ?? "en-US", {
    maximumFractionDigits: 2,
    ...options,
}).format(value);
const formatDatePart = (date, options, hass) => {
    const { locale, timeZone } = getFormatterContext(hass);
    try {
        return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
    }
    catch {
        return date.toLocaleDateString();
    }
};

const clampAlpha = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
/**
 * `rgb()` and `rgba()` in both the legacy comma form and the modern space form,
 * with percentages allowed for any channel: `rgb(255, 0, 0)`,
 * `rgb(255 0 0 / 50%)`, `rgb(100% 0% 0%)`.
 */
const RGB_PATTERN = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i;
const channel = (raw) => raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * 255 : Number(raw);
const alphaChannel = (raw) => {
    if (raw === undefined) {
        return 1;
    }
    return clampAlpha(raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw));
};
const hexToParsed = (value) => {
    const hex = value.replace("#", "").trim();
    const short = hex.length === 3 || hex.length === 4;
    const long = hex.length === 6 || hex.length === 8;
    if (!short && !long) {
        return null;
    }
    const part = (index) => {
        const raw = short
            ? hex[index].repeat(2)
            : hex.substring(index * 2, index * 2 + 2);
        return parseInt(raw, 16);
    };
    const hasAlpha = hex.length === 4 || hex.length === 8;
    const parsed = { r: part(0), g: part(1), b: part(2), a: hasAlpha ? part(3) / 255 : 1 };
    return Number.isNaN(parsed.r) || Number.isNaN(parsed.g) || Number.isNaN(parsed.b)
        ? null
        : parsed;
};
const rgbStringToParsed = (value) => {
    const match = value.match(RGB_PATTERN);
    if (!match) {
        return null;
    }
    const parsed = {
        r: channel(match[1]),
        g: channel(match[2]),
        b: channel(match[3]),
        a: alphaChannel(match[4]),
    };
    return Number.isFinite(parsed.r) && Number.isFinite(parsed.g) && Number.isFinite(parsed.b)
        ? parsed
        : null;
};
/** Lazily created; `null` once it is known that no canvas is available. */
let canvasContext;
/**
 * Last resort for everything the patterns above do not cover: named colors,
 * `hsl()`, and whatever a theme resolves to on a modern browser - `oklch()`,
 * `color-mix()`. Assigning to `fillStyle` normalizes a color the browser
 * understands and is ignored for one it does not, so two different sentinels
 * before the same assignment tell the two apart.
 */
const normalizeThroughCanvas = (value) => {
    if (canvasContext === undefined) {
        try {
            canvasContext = document.createElement("canvas").getContext("2d");
        }
        catch {
            canvasContext = null;
        }
    }
    if (!canvasContext) {
        return undefined;
    }
    try {
        canvasContext.fillStyle = "#000000";
        canvasContext.fillStyle = value;
        const first = String(canvasContext.fillStyle);
        canvasContext.fillStyle = "#ffffff";
        canvasContext.fillStyle = value;
        const second = String(canvasContext.fillStyle);
        return first === second ? first : undefined;
    }
    catch {
        return undefined;
    }
};
const CACHE_LIMIT = 256;
const parseCache = new Map();
const warned = new Set();
/**
 * Parses any color literal into channels. Colors are resolved once per literal
 * and cached, because this runs per series on every redraw.
 */
const parseColorWithAlpha = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const cached = parseCache.get(trimmed);
    if (cached !== undefined) {
        return cached;
    }
    let parsed = trimmed.startsWith("#")
        ? hexToParsed(trimmed)
        : rgbStringToParsed(trimmed);
    if (!parsed) {
        const normalized = normalizeThroughCanvas(trimmed);
        if (normalized) {
            parsed = normalized.startsWith("#")
                ? hexToParsed(normalized)
                : rgbStringToParsed(normalized);
        }
    }
    if (!parsed && !warned.has(trimmed)) {
        warned.add(trimmed);
        // Silence here would show up as an opacity option that quietly does
        // nothing, which is a good deal harder to find than a line in the console.
        log("warn", `The color "${trimmed}" could not be read. Opacity and compare colors are left unchanged for it.`);
    }
    if (parseCache.size >= CACHE_LIMIT) {
        parseCache.clear();
    }
    parseCache.set(trimmed, parsed);
    return parsed;
};
const parseColor = (value) => {
    const parsed = parseColorWithAlpha(value);
    return parsed ? { r: parsed.r, g: parsed.g, b: parsed.b } : null;
};
/**
 * Returns the alpha channel of a color literal, or `undefined` when the color
 * cannot be read at all. An opaque color reports `1`.
 */
const extractAlpha = (color) => {
    if (typeof color !== "string") {
        return undefined;
    }
    return parseColorWithAlpha(color)?.a;
};
const applyAlpha = (color, alpha) => {
    const rgb = parseColor(color);
    if (!rgb) {
        return color.trim();
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampAlpha(alpha)})`;
};
/** Recolors `color` while keeping the alpha channel of an existing literal. */
const colorWithAlpha = (color, alpha) => {
    if (alpha === undefined || alpha >= 1) {
        return color;
    }
    const rgb = parseColor(color);
    if (!rgb) {
        return color;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};
/** Recolors every stop of an existing linear gradient, keeping its alphas. */
const gradientWithColor = (color, gradient) => {
    if (!gradient || typeof gradient !== "object" || Array.isArray(gradient)) {
        return undefined;
    }
    const source = gradient;
    if (source.type !== "linear" || !Array.isArray(source.colorStops)) {
        return undefined;
    }
    return {
        ...source,
        colorStops: source.colorStops.map((stop) => {
            if (!stop || typeof stop !== "object" || Array.isArray(stop)) {
                return stop;
            }
            const colorStop = stop;
            return {
                ...colorStop,
                color: colorWithAlpha(color, extractAlpha(colorStop.color)),
            };
        }),
    };
};
/**
 * Picks the color for the active theme. A plain string applies to both themes;
 * the object form falls back from `dark` to `light`.
 */
const resolveThemedColor = (value, darkMode) => {
    const clean = (raw) => typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
    const isObject = typeof value === "object" && value !== null;
    const light = isObject ? clean(value.light) : clean(value);
    const dark = isObject ? clean(value.dark) : undefined;
    return darkMode ? dark ?? light : light;
};
/**
 * Turns a configured color token into something ECharts understands. CSS custom
 * properties (`--energy-solar-color` or `var(--x)`) are resolved against the
 * card's computed style so theme changes are picked up.
 */
const resolveColorToken = (raw, computedStyle) => {
    let token = raw.trim();
    if (!token) {
        return token;
    }
    if (token.startsWith("#") || token.startsWith("rgb")) {
        return token;
    }
    if (token.startsWith("var(") && token.endsWith(")")) {
        token = token.slice(4, -1).trim();
    }
    const resolved = computedStyle.getPropertyValue(token)?.trim();
    return resolved || token;
};
/**
 * Builds an area fill that fades towards the zero line, so positive and
 * negative parts of a signal both keep their strong edge away from zero.
 */
const buildZeroAwareGradientFill = (color, strongAlpha, dataPoints) => {
    let min = 0;
    let max = 0;
    dataPoints.forEach(([, value]) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return;
        }
        min = Math.min(min, value);
        max = Math.max(max, value);
    });
    const strongColor = applyAlpha(color, strongAlpha);
    const weakColor = applyAlpha(color, strongAlpha / 3);
    let colorStops;
    if (max === 0 && min === 0) {
        colorStops = [
            { offset: 0, color: weakColor },
            { offset: 1, color: weakColor },
        ];
    }
    else if (min >= 0) {
        colorStops = [
            { offset: 0, color: strongColor },
            { offset: 1, color: weakColor },
        ];
    }
    else if (max <= 0) {
        colorStops = [
            { offset: 0, color: weakColor },
            { offset: 1, color: strongColor },
        ];
    }
    else {
        colorStops = [
            { offset: 0, color: strongColor },
            { offset: clampAlpha(max / (max - min)), color: weakColor },
            { offset: 1, color: strongColor },
        ];
    }
    return { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops, global: false };
};

/** Default palette: the colors the energy dashboard uses. */
const DEFAULT_COLOR_CYCLE = [
    "--energy-grid-consumption-color",
    "--energy-grid-return-color",
    "--energy-solar-color",
    "--energy-battery-in-color",
    "--energy-battery-out-color",
    "--energy-gas-color",
    "--energy-water-color",
    "--energy-non-fossil-color",
];
const BAR_MAX_WIDTH = 50;
const BAR_FILL_ALPHA = 0.5;
const BAR_BORDER_ALPHA = 1;
const LINE_ALPHA = 0.85;
const LINE_AREA_ALPHA = 0.15;
const LINE_GRADIENT_STRONG_ALPHA = 0.75;
const DEFAULT_LINE_WIDTH = 1.5;
/**
 * Stacked line series must be drawn back-to-front, otherwise the fill of a
 * lower series covers the line above it.
 */
const buildStackedLineZ = (configSeries) => {
    const groups = new Map();
    configSeries.forEach((series, index) => {
        const chartType = series.chart_type ?? "bar";
        const stack = series.stack?.trim();
        if ((chartType !== "line" && chartType !== "step") || !stack) {
            return;
        }
        const axis = series.y_axis === "right" ? "right" : "left";
        const key = `${axis}:${stack}`;
        groups.set(key, [...(groups.get(key) ?? []), index]);
    });
    const zByIndex = new Map();
    groups.forEach((indexes) => {
        indexes.forEach((seriesIndex, position) => {
            zByIndex.set(seriesIndex, indexes[indexes.length - position - 1]);
        });
    });
    return zByIndex;
};
const resolveSeriesName = (series, index, statisticId, hass, metadata) => {
    if (series.name) {
        return series.name;
    }
    if (statisticId) {
        return (hass.states[statisticId]?.attributes.friendly_name ??
            metadata[statisticId]?.name ??
            statisticId);
    }
    return `Series ${index + 1}`;
};
const toDataPoints = (raw, series) => {
    const statKey = series.stat_type ?? DEFAULT_STAT_TYPE;
    return raw.map((entry) => {
        const value = entry[statKey];
        const timestamp = entry.start ?? entry.end;
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return [timestamp, null];
        }
        return [timestamp, transformValue(value, series)];
    });
};
/**
 * Renders the band between two line series as a transparent baseline plus a
 * stacked area on top - ECharts has no native "fill between" mode.
 */
const buildFillBand = (source, target, logger) => {
    const valuesOf = (points) => {
        const map = new Map();
        points.forEach(([timestamp, value]) => map.set(timestamp, value));
        return map;
    };
    const upperValues = valuesOf(source.dataPoints);
    const lowerValues = valuesOf(target.dataPoints);
    const buckets = Array.from(new Set([...upperValues.keys(), ...lowerValues.keys()])).sort((a, b) => a - b);
    const baselineData = [];
    const bandData = [];
    let clamped = false;
    buckets.forEach((bucket) => {
        const upper = upperValues.get(bucket);
        const lower = lowerValues.get(bucket);
        if (upper === undefined ||
            lower === undefined ||
            upper === null ||
            lower === null) {
            baselineData.push([bucket, lower ?? null]);
            bandData.push([bucket, null]);
            return;
        }
        const diff = upper - lower;
        if (diff < 0) {
            clamped = true;
            baselineData.push([bucket, lower]);
            bandData.push([bucket, 0]);
            return;
        }
        baselineData.push([bucket, lower]);
        bandData.push([bucket, diff]);
    });
    if (!bandData.some(([, value]) => typeof value === "number" && value > 0)) {
        return [];
    }
    if (clamped) {
        logger.warnOnce(`fill-clamped-${source.name}-${target.name}`, `"${source.name}" dropped below "${target.name}". Negative differences were clamped to zero.`);
    }
    const stackId = `__fill_${source.id}`;
    const sourceZ = typeof source.series.z === "number" ? source.series.z : 2;
    const targetZ = typeof target.series.z === "number" ? target.series.z : 2;
    const bandZ = sourceZ - 0.1 < 0 ? sourceZ + 0.1 : sourceZ - 0.1;
    const baseZ = Math.max(Math.min(bandZ - 0.01, targetZ - 0.1), 0);
    const shared = {
        type: "line",
        stack: stackId,
        stackStrategy: "all",
        showSymbol: false,
        silent: true,
        legendHoverLink: false,
        emphasis: { disabled: true },
        yAxisIndex: source.series.yAxisIndex,
    };
    const baseline = {
        ...shared,
        id: `${source.id}__fill_base`,
        name: `${source.name}__fill_base`,
        data: baselineData,
        smooth: target.series.smooth,
        lineStyle: { width: 0, color: target.lineColor },
        areaStyle: { opacity: 0 },
        yAxisIndex: target.series.yAxisIndex,
        z: baseZ,
    };
    const band = {
        ...shared,
        id: `${source.id}__fill_area`,
        name: `${source.name}__fill_area`,
        data: bandData,
        smooth: source.series.smooth,
        lineStyle: { width: 0, color: source.lineColor },
        areaStyle: { color: source.fillColor },
        itemStyle: { color: source.fillColor },
        z: bandZ,
    };
    return [baseline, band];
};
/**
 * Turns the configured series into ECharts series options.
 *
 * The generated id encodes source key, statistic type, chart type and config
 * index, which keeps ids stable across redraws and unique per configuration.
 */
const buildSeries = ({ hass, configSeries, statistics, metadata, calculatedData, colorCycle, darkMode, computedStyle, logger, }) => {
    const palette = colorCycle.length ? colorCycle : DEFAULT_COLOR_CYCLE;
    const paletteColorAt = (index) => resolveThemedColor(palette[index % palette.length], darkMode) ??
        DEFAULT_COLOR_CYCLE[index % DEFAULT_COLOR_CYCLE.length];
    const output = [];
    const configById = new Map();
    const lineSeriesByName = new Map();
    const fillRequests = [];
    const stackedLineZ = buildStackedLineZ(configSeries);
    configSeries.forEach((series, index) => {
        const source = getSeriesSource(series);
        const statisticId = source === "statistic" ? getStatisticId(series) : undefined;
        const calcKey = source === "calculation" ? calculationKey(index) : undefined;
        let raw;
        if (calcKey) {
            raw = calculatedData.get(calcKey);
            if (!raw?.length) {
                logger.warnOnce(`calculation-empty-${index}`, `Calculation series "${series.name ?? calcKey}" produced no data.`, "debug");
                return;
            }
        }
        else if (statisticId) {
            raw = statistics[statisticId];
            if (!raw?.length) {
                logger.warnOnce(`statistics-empty-${statisticId}`, `No statistics available for "${statisticId}".`, "debug");
                return;
            }
        }
        else {
            logger.warnOnce(`series-misconfigured-${index}`, `Series at index ${index} has no valid data source.`);
            return;
        }
        const chartType = series.chart_type ?? "bar";
        const isStep = chartType === "step";
        const isLineLike = chartType === "line" || isStep;
        const name = resolveSeriesName(series, index, statisticId, hass, metadata);
        const colorToken = resolveThemedColor(series.color, darkMode) ?? paletteColorAt(index);
        const colorValue = resolveColorToken(colorToken, computedStyle);
        const lineOpacity = typeof series.line_opacity === "number"
            ? clampAlpha(series.line_opacity)
            : undefined;
        const baseKey = statisticId ?? calcKey ?? `series_${index}`;
        const statType = series.stat_type ?? DEFAULT_STAT_TYPE;
        const id = `${baseKey}:${statType}:${chartType}:${index}`;
        configById.set(id, series);
        const dataPoints = toDataPoints(raw, series);
        if (isLineLike) {
            const strokeAlpha = lineOpacity ?? LINE_ALPHA;
            const lineColor = applyAlpha(colorValue, strokeAlpha);
            const fillOpacity = typeof series.fill_opacity === "number"
                ? clampAlpha(series.fill_opacity)
                : LINE_AREA_ALPHA;
            const fillColor = applyAlpha(colorValue, fillOpacity);
            const smooth = typeof series.smooth === "number"
                ? clampAlpha(series.smooth)
                : series.smooth;
            const lineSeries = {
                id,
                name,
                type: "line",
                data: dataPoints,
                showSymbol: false,
                smooth: isStep ? false : smooth ?? true,
                stack: series.stack,
                yAxisIndex: series.y_axis === "right" ? 1 : 0,
                z: stackedLineZ.get(index) ?? index,
                lineStyle: {
                    width: series.line_width ?? DEFAULT_LINE_WIDTH,
                    color: lineColor,
                    type: series.line_style ?? "solid",
                },
                itemStyle: { color: lineColor, borderColor: lineColor },
                legendHoverLink: false,
                emphasis: { disabled: true },
                color: lineColor,
            };
            if (isStep) {
                lineSeries.step = "end";
            }
            if (series.fill === true) {
                lineSeries.areaStyle = {
                    color: series.gradient_fill === true
                        ? buildZeroAwareGradientFill(colorValue, typeof series.fill_opacity === "number"
                            ? fillOpacity
                            : LINE_GRADIENT_STRONG_ALPHA, dataPoints)
                        : fillColor,
                };
            }
            output.push(lineSeries);
            if (lineSeriesByName.has(name)) {
                logger.warnOnce(`duplicate-name-${name}`, `Multiple series are named "${name}". fill_to_series references are ambiguous.`);
            }
            else {
                lineSeriesByName.set(name, {
                    id,
                    name,
                    config: series,
                    dataPoints,
                    lineColor,
                    fillColor,
                    series: lineSeries,
                });
            }
            const targetName = series.fill_to_series?.trim();
            if (targetName) {
                fillRequests.push({ sourceName: name, targetName });
            }
        }
        else {
            const fillOpacity = typeof series.fill_opacity === "number"
                ? clampAlpha(series.fill_opacity)
                : BAR_FILL_ALPHA;
            const fillColor = applyAlpha(colorValue, fillOpacity);
            const borderColor = applyAlpha(colorValue, lineOpacity ?? BAR_BORDER_ALPHA);
            const barSeries = {
                id,
                name,
                type: "bar",
                data: dataPoints,
                stack: series.stack,
                yAxisIndex: series.y_axis === "right" ? 1 : 0,
                z: index,
                itemStyle: { color: fillColor, borderColor },
                legendHoverLink: false,
                emphasis: { disabled: true },
                color: fillColor,
                barMaxWidth: BAR_MAX_WIDTH,
            };
            if (series.fill_to_series) {
                logger.warnOnce(`fill-bar-${name}`, `Series "${name}" is a bar chart and cannot use fill_to_series.`);
            }
            output.push(barSeries);
        }
    });
    fillRequests.forEach(({ sourceName, targetName }) => {
        const source = lineSeriesByName.get(sourceName);
        const target = lineSeriesByName.get(targetName);
        if (!source) {
            return;
        }
        if (source.config.stack) {
            logger.warnOnce(`fill-source-stack-${sourceName}`, `Series "${sourceName}" combines stacking with fill_to_series, which is not supported.`);
            return;
        }
        if (!target) {
            logger.warnOnce(`fill-target-missing-${sourceName}-${targetName}`, `fill_to_series of "${sourceName}" references "${targetName}", which is not an existing line series.`);
            return;
        }
        if (target.config.stack) {
            logger.warnOnce(`fill-target-stack-${targetName}`, `Series "${targetName}" uses stacking and cannot be a fill target.`);
            return;
        }
        if (source.name === target.name) {
            logger.warnOnce(`fill-self-${sourceName}`, `Series "${sourceName}" references itself in fill_to_series.`);
            return;
        }
        output.push(...buildFillBand(source, target, logger));
    });
    return { series: output, configById };
};

const REAL_VALUE_FLAG = "__realValue";
const CORNER_RADIUS = 4;
const toBarItem = (point) => {
    if (Array.isArray(point)) {
        const value = typeof point[1] === "number" ? point[1] : null;
        return { value: [point[0], value] };
    }
    if (point && Array.isArray(point.value)) {
        const [timestamp, raw] = point.value;
        return {
            ...point,
            value: [timestamp, typeof raw === "number" ? raw : null],
        };
    }
    return undefined;
};
const applyValueLabel = (serie, item, context) => {
    const seriesId = typeof serie.id === "string" ? serie.id : undefined;
    if (!seriesId || !item[REAL_VALUE_FLAG]) {
        return;
    }
    const config = context.configById.get(seriesId);
    if (config?.show_value_labels !== true) {
        return;
    }
    if (config.stack?.trim()) {
        context.logger.warnOnce(`value-label-stacked-${toBaseId(seriesId)}`, `Value labels are ignored for the stacked bar series "${serie.name ?? seriesId}".`);
        return;
    }
    const value = item.value[1];
    if (typeof value !== "number" || value === 0) {
        item.label = { show: false };
        return;
    }
    const precision = typeof config.value_label_precision === "number" &&
        Number.isFinite(config.value_label_precision)
        ? Math.max(0, Math.min(20, Math.trunc(config.value_label_precision)))
        : 0;
    item.label = {
        show: true,
        position: value > 0 ? "top" : "bottom",
        formatter: context.formatValue(value, precision),
        color: context.valueLabelColor,
        fontSize: 11,
        distance: 4,
    };
    serie.labelLayout = {
        ...(serie.labelLayout ?? {}),
        hideOverlap: true,
    };
};
/**
 * Aligns all bar series onto one shared bucket grid and applies the rounded
 * corner that marks the outer end of every stack.
 *
 * ECharts positions bars by category order, so each series must contain an
 * entry for every bucket; missing buckets are filled with borderless zeros.
 */
const applyBarStyling = (series, context) => {
    const barSeries = series.filter((item) => item.type === "bar");
    if (!barSeries.length) {
        return;
    }
    const bucketSet = new Set(context.buckets ?? []);
    barSeries.forEach((serie) => {
        serie.data?.forEach((point) => {
            const item = toBarItem(point);
            if (item) {
                bucketSet.add(item.value[0]);
            }
        });
    });
    const buckets = Array.from(bucketSet).sort((a, b) => a - b);
    barSeries.forEach((serie) => {
        const baseItemStyle = { ...(serie.itemStyle ?? {}) };
        const byTimestamp = new Map();
        serie.data?.forEach((point) => {
            const item = toBarItem(point);
            if (!item) {
                return;
            }
            byTimestamp.set(item.value[0], {
                ...item,
                [REAL_VALUE_FLAG]: true,
                itemStyle: { ...baseItemStyle, ...(item.itemStyle ?? {}) },
            });
        });
        serie.data = buckets.map((bucket) => byTimestamp.get(bucket) ?? {
            value: [bucket, 0],
            itemStyle: { ...baseItemStyle, borderWidth: 0, borderRadius: [0, 0, 0, 0] },
        });
        serie.itemStyle = baseItemStyle;
        serie.barMaxWidth = serie.barMaxWidth ?? BAR_MAX_WIDTH;
    });
    buckets.forEach((_bucket, bucketIndex) => {
        const roundedPositive = new Set();
        const roundedNegative = new Set();
        // Walk the stack from the top so the outermost segment gets the radius.
        for (let idx = barSeries.length - 1; idx >= 0; idx--) {
            const serie = barSeries[idx];
            const item = serie.data?.[bucketIndex];
            if (!item || !Array.isArray(item.value)) {
                continue;
            }
            const value = item.value[1] ?? 0;
            const stackKey = serie.stack ?? `__stack_${idx}`;
            const itemStyle = {
                ...(serie.itemStyle ?? {}),
                ...(item.itemStyle ?? {}),
                borderRadius: [0, 0, 0, 0],
            };
            if (!value) {
                itemStyle.borderWidth = 0;
                item.itemStyle = itemStyle;
                continue;
            }
            if (value > 0 && !roundedPositive.has(stackKey)) {
                itemStyle.borderRadius = [CORNER_RADIUS, CORNER_RADIUS, 0, 0];
                roundedPositive.add(stackKey);
            }
            else if (value < 0 && !roundedNegative.has(stackKey)) {
                itemStyle.borderRadius = [0, 0, CORNER_RADIUS, CORNER_RADIUS];
                roundedNegative.add(stackKey);
            }
            applyValueLabel(serie, item, context);
            item.itemStyle = itemStyle;
        }
    });
};

const COMPARE_OPACITY = 0.6;
const BAR_Z_BASE = 10;
/**
 * Maps a timestamp of the compare range onto the visible range.
 *
 * Calendar-aligned ranges are shifted by whole years, months or days so that
 * e.g. February compared against January keeps its own day count.
 */
const createCompareTransform = (start, compareStart) => {
    const yearDiff = differenceInYears(start, compareStart);
    if (yearDiff !== 0 && start.getTime() === startOfYear(start).getTime()) {
        return (timestamp) => addYears(new Date(timestamp), yearDiff).getTime();
    }
    const monthDiff = differenceInMonths(start, compareStart);
    if (monthDiff !== 0 && start.getTime() === startOfMonth(start).getTime()) {
        return (timestamp) => addMonths(new Date(timestamp), monthDiff).getTime();
    }
    const dayDiff = differenceInDays(start, compareStart);
    if (dayDiff !== 0 && start.getTime() === startOfDay(start).getTime()) {
        return (timestamp) => addDays(new Date(timestamp), dayDiff).getTime();
    }
    const offset = start.getTime() - compareStart.getTime();
    return (timestamp) => timestamp + offset;
};
const recolor = (color, existing) => colorWithAlpha(color, extractAlpha(existing));
/**
 * Fades a compare series, or recolors it when the series configures an explicit
 * `compare_color`. Compare series are always drawn below their counterpart.
 */
const styleCompareSeries = (serie, overrideColor) => {
    if (overrideColor?.trim()) {
        const color = overrideColor.trim();
        const itemColor = recolor(color, serie.itemStyle?.color);
        serie.itemStyle = { ...(serie.itemStyle ?? {}), color: itemColor };
        serie.color = itemColor;
        if (serie.type === "bar") {
            serie.itemStyle = { ...serie.itemStyle, borderColor: itemColor };
            return;
        }
        const lineColor = recolor(color, serie.lineStyle?.color);
        serie.lineStyle = { ...(serie.lineStyle ?? {}), color: lineColor };
        serie.color = lineColor;
        if (serie.areaStyle) {
            const areaStyle = { ...serie.areaStyle };
            areaStyle.color =
                gradientWithColor(color, areaStyle.color) ?? recolor(color, areaStyle.color);
            serie.areaStyle = areaStyle;
        }
        serie.connectNulls = false;
        return;
    }
    if (serie.type === "bar") {
        serie.itemStyle = { ...(serie.itemStyle ?? {}), opacity: COMPARE_OPACITY };
    }
    else {
        serie.lineStyle = { ...(serie.lineStyle ?? {}), opacity: COMPARE_OPACITY };
        serie.itemStyle = { ...(serie.itemStyle ?? {}), opacity: COMPARE_OPACITY };
        if (serie.areaStyle) {
            const areaStyle = serie.areaStyle;
            const opacity = typeof areaStyle.opacity === "number" ? areaStyle.opacity : COMPARE_OPACITY / 2;
            serie.areaStyle = { ...areaStyle, opacity: opacity * 0.6 };
        }
        serie.connectNulls = false;
    }
};
/**
 * Assigns bar stack names for the "current" and "compare" halves of the chart.
 *
 * ECharts draws one column per stack name, so the two halves end up side by
 * side. A transparent placeholder per stack keeps the column order stable even
 * when the compare range has no data for a series.
 */
class BarStackLayout {
    constructor() {
        this._baseKeyBySeriesId = new Map();
        this._placeholderByBase = new Map();
        this._zByBase = new Map();
        this._order = [];
        this._generatedStacks = 0;
    }
    /** Places a main-range bar series into its "current" stack. */
    assignCurrent(serie, index) {
        const id = serie.id ?? `bar_${index}`;
        const baseKey = this._baseKeyFor(serie.stack);
        this._baseKeyBySeriesId.set(id, baseKey);
        const z = this._resolveZ(baseKey, serie.z);
        serie.z = z;
        serie.stack = `${baseKey}--current`;
        this._ensurePlaceholder(baseKey, z, "current");
    }
    /** Places a compare-range bar series into its "compare" stack. */
    assignCompare(serie, baseId) {
        const baseKey = this._baseKeyBySeriesId.get(baseId) ?? this._baseKeyFor(serie.stack);
        this._baseKeyBySeriesId.set(baseId, baseKey);
        const z = this._resolveZ(baseKey, serie.z);
        serie.z = z;
        serie.stack = `${baseKey}--compare`;
        this._ensurePlaceholder(baseKey, z, "compare");
    }
    /** Placeholder series, in the order their stacks first appeared. */
    placeholders() {
        return this._order
            .map((baseKey) => this._placeholderByBase.get(baseKey))
            .filter((item) => item !== undefined);
    }
    _baseKeyFor(stack) {
        const name = stack?.trim();
        if (name) {
            return name;
        }
        this._generatedStacks += 1;
        return `series-${this._generatedStacks}`;
    }
    _resolveZ(baseKey, current) {
        const candidate = typeof current === "number" && Number.isFinite(current)
            ? Math.max(current, BAR_Z_BASE)
            : BAR_Z_BASE;
        const resolved = Math.max(this._zByBase.get(baseKey) ?? candidate, candidate);
        this._zByBase.set(baseKey, resolved);
        return resolved;
    }
    _ensurePlaceholder(baseKey, z, half) {
        const placeholderZ = Math.max(z - 3, 0);
        const existing = this._placeholderByBase.get(baseKey);
        if (existing) {
            existing.stack = `${baseKey}--${half}`;
            existing.z = placeholderZ;
            return;
        }
        this._order.push(baseKey);
        this._placeholderByBase.set(baseKey, {
            id: `${baseKey}--placeholder`,
            type: "bar",
            stack: `${baseKey}--${half}`,
            data: [],
            silent: true,
            itemStyle: {
                color: "transparent",
                borderColor: "transparent",
                borderWidth: 0,
            },
            emphasis: { disabled: true },
            barMaxWidth: BAR_MAX_WIDTH,
            z: placeholderZ,
        });
    }
}

const toTuple = (point) => {
    const raw = Array.isArray(point) ? point : point?.value;
    if (!Array.isArray(raw) || typeof raw[0] !== "number") {
        return undefined;
    }
    const value = typeof raw[1] === "number" ? raw[1] : null;
    return [raw[0], value];
};
const asTuples = (data) => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    const tuples = [];
    for (const point of data) {
        if (!Array.isArray(point) || typeof point[0] !== "number") {
            return undefined;
        }
        tuples.push(point);
    }
    return tuples;
};
/**
 * Projects every line series onto the bucket grid of the visible range.
 *
 * Buckets without a sample become explicit `null` values, so ECharts draws a
 * gap instead of connecting across missing data.
 */
const normalizeLineSeries = (series, buckets) => {
    if (!buckets.length) {
        return;
    }
    series.forEach((serie) => {
        if (serie.type !== "line" || !Array.isArray(serie.data)) {
            return;
        }
        const byTimestamp = new Map();
        serie.data.forEach((point) => {
            const tuple = toTuple(point);
            if (tuple) {
                byTimestamp.set(tuple[0], tuple[1]);
            }
        });
        serie.data = buckets.map((bucket) => [bucket, byTimestamp.get(bucket) ?? null]);
    });
};
/**
 * Carries the last known value forward to `limit`. Used for step charts, whose
 * value stays valid until the next state change.
 */
const extendStepSeriesToLimit = (data, limit) => {
    if (!Number.isFinite(limit) || !data.length) {
        return;
    }
    let lastIndex = -1;
    for (let idx = data.length - 1; idx >= 0; idx--) {
        const [timestamp, value] = data[idx];
        if (timestamp <= limit && typeof value === "number") {
            lastIndex = idx;
            break;
        }
    }
    if (lastIndex === -1) {
        return;
    }
    const [lastTimestamp, lastValue] = data[lastIndex];
    if (limit <= lastTimestamp || typeof lastValue !== "number") {
        return;
    }
    for (let idx = lastIndex + 1; idx < data.length; idx++) {
        if (data[idx][0] > limit) {
            break;
        }
        if (data[idx][1] === null) {
            data[idx][1] = lastValue;
        }
    }
    const insertion = data.findIndex(([timestamp]) => timestamp >= limit);
    if (insertion === -1) {
        data.push([limit, lastValue]);
    }
    else if (data[insertion][0] === limit) {
        data[insertion][1] = data[insertion][1] ?? lastValue;
    }
    else {
        data.splice(insertion, 0, [limit, lastValue]);
    }
};
/**
 * Pulls a raw-history line up to "now" so a live chart does not end at the last
 * reported state somewhere in the past.
 */
const extendRawLineToNow = (data, now) => {
    let lastIndex = -1;
    let lastValue = null;
    for (let idx = data.length - 1; idx >= 0; idx--) {
        const [timestamp, value] = data[idx];
        if (timestamp > now) {
            continue;
        }
        if (typeof value === "number") {
            lastIndex = idx;
            lastValue = value;
            break;
        }
    }
    if (lastIndex === -1 || lastValue === null) {
        return;
    }
    for (let idx = lastIndex + 1; idx < data.length; idx++) {
        if (data[idx][0] > now) {
            break;
        }
        if (data[idx][1] === null) {
            data[idx][1] = lastValue;
        }
    }
    if (data.some((point) => Math.abs(point[0] - now) <= 1000)) {
        return;
    }
    const insertion = data.findIndex((point) => point[0] > now);
    if (insertion === -1) {
        data.push([now, lastValue]);
    }
    else {
        data.splice(insertion, 0, [now, lastValue]);
    }
};
const extendLineSeries = (series, context) => {
    const now = Date.now();
    series.forEach((serie) => {
        if (serie.type !== "line" || !serie.data?.length) {
            return;
        }
        const tuples = asTuples(serie.data);
        if (!tuples) {
            return;
        }
        const seriesId = typeof serie.id === "string" ? serie.id : undefined;
        const isCompare = context.isCompare(seriesId);
        const chartType = context.chartTypeOf(seriesId);
        if (chartType === "step") {
            const rangeEnd = isCompare ? context.compareDisplayEnd : context.displayEnd;
            extendStepSeriesToLimit(tuples, Math.min(rangeEnd ?? now, now));
            return;
        }
        const displayEnd = isCompare ? context.compareDisplayEnd : context.displayEnd;
        const shouldExtend = isCompare ? context.extendCompare : context.extendMain;
        if (!shouldExtend || displayEnd === null || displayEnd <= now) {
            return;
        }
        extendRawLineToNow(tuples, now);
    });
};
/** Snapshot with all values set to zero, used as the animation start frame. */
const createZeroSnapshot = (series) => {
    const clone = typeof structuredClone === "function"
        ? structuredClone(series)
        : JSON.parse(JSON.stringify(series));
    clone.forEach((serie) => {
        if (!Array.isArray(serie.data)) {
            return;
        }
        serie.data = serie.data.map((point) => {
            if (Array.isArray(point)) {
                return [point[0], point[1] === null ? null : 0];
            }
            if (point && Array.isArray(point.value)) {
                return {
                    ...point,
                    value: [point.value[0], point.value[1] === null ? null : 0],
                };
            }
            return point;
        });
    });
    return clone;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_AXIS_MIN_INTERVAL_MS = 28 * DAY_MS;
const YEAR_AXIS_MIN_INTERVAL_MS = 365 * DAY_MS;
const formatMonthLabel = (value, hass) => {
    const date = new Date(value);
    const isJanuary = date.getMonth() === 0;
    const label = formatDatePart(date, isJanuary ? { month: "long", year: "numeric" } : { month: "long" }, hass);
    // Highlight the year boundary inside a multi-year range.
    return isJanuary ? `{bold|${label}}` : label;
};
/**
 * Keeps the last bucket of a long range fully visible: months and years are
 * labelled at their start, so the axis has to reach the final bucket start.
 */
const computeAxisMax = (start, end, aggregation, buckets, fallbackEnd) => {
    if ((aggregation === "month" || aggregation === "year") &&
        buckets &&
        buckets.length > 1) {
        const lastBucket = buckets[buckets.length - 1];
        if (lastBucket > start.getTime()) {
            return lastBucket;
        }
    }
    if (!end) {
        return fallbackEnd ?? start.getTime();
    }
    // Trim the exclusive end of long ranges back to the last labelled tick.
    const dayDifference = differenceInDays(end, start);
    let max = new Date(end);
    if (dayDifference > 2 && max.getHours() === 0) {
        max = subHours(max, 1);
    }
    if (dayDifference > 2) {
        max.setMinutes(0, 0, 0);
    }
    if (dayDifference > 35) {
        max.setDate(1);
    }
    if (dayDifference > 2) {
        max.setHours(0);
    }
    return max.getTime();
};
const buildXAxis = ({ start, end, aggregation, buckets, fallbackEnd, hass, }) => {
    const primary = {
        id: "primary",
        type: "time",
        min: start,
        max: computeAxisMax(start, end, aggregation, buckets, fallbackEnd),
        axisPointer: { show: false },
    };
    if (aggregation === "month") {
        primary.minInterval = MONTH_AXIS_MIN_INTERVAL_MS;
        primary.axisLabel = {
            formatter: (value) => formatMonthLabel(value, hass),
        };
    }
    else if (aggregation === "year") {
        primary.minInterval = YEAR_AXIS_MIN_INTERVAL_MS;
        primary.axisLabel = {
            formatter: (value) => formatDatePart(new Date(value), { year: "numeric" }, hass),
        };
    }
    // `ha-chart-base` expects a second, hidden axis for its internal handling.
    return [primary, { id: "secondary", type: "time", show: false }];
};
/** Rounds up to a readable axis bound (1, 1.2, 1.5, 2, ... times a power of 10). */
const roundToNiceValue = (value) => {
    if (value === 0) {
        return 1;
    }
    const niceNumbers = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
    const normalized = Math.abs(value) / magnitude;
    return (niceNumbers.find((n) => n >= normalized) ?? 10) * magnitude;
};
/**
 * Data range of one axis. Stacked series are summed per timestamp, with
 * positive and negative stacks tracked separately - exactly how ECharts stacks.
 */
const getDataRange = (series, axisIndex) => {
    const relevant = series.filter((serie) => (serie.yAxisIndex ?? 0) === axisIndex);
    if (!relevant.length) {
        return undefined;
    }
    let min = Infinity;
    let max = -Infinity;
    const stackTotals = new Map();
    relevant.forEach((serie) => {
        serie.data?.forEach((point) => {
            const tuple = toTuple(point);
            if (!tuple || tuple[1] === null || !Number.isFinite(tuple[1])) {
                return;
            }
            const [timestamp, value] = tuple;
            if (!serie.stack) {
                min = Math.min(min, value);
                max = Math.max(max, value);
                return;
            }
            const perStack = stackTotals.get(serie.stack) ?? new Map();
            const totals = perStack.get(timestamp) ?? { positive: 0, negative: 0 };
            if (value >= 0) {
                totals.positive += value;
            }
            else {
                totals.negative += value;
            }
            perStack.set(timestamp, totals);
            stackTotals.set(serie.stack, perStack);
        });
    });
    stackTotals.forEach((perStack) => {
        perStack.forEach(({ positive, negative }) => {
            min = Math.min(min, negative);
            max = Math.max(max, positive);
        });
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return undefined;
    }
    return { min, max };
};
const buildYAxes = ({ axes, seriesConfigs, series, hass, }) => {
    const leftConfig = axes.find((axis) => axis.id === "left");
    const rightConfig = axes.find((axis) => axis.id === "right");
    const usesRight = !!rightConfig || seriesConfigs.some((config) => config.y_axis === "right");
    const createAxis = (config, index) => {
        let min = config?.min;
        let max = config?.max;
        if (config?.center_zero) {
            if (max !== undefined) {
                min = -max;
            }
            else {
                const range = getDataRange(series, index);
                if (range) {
                    const bound = roundToNiceValue(Math.max(Math.abs(range.min), Math.abs(range.max)));
                    min = -bound;
                    max = bound;
                }
            }
        }
        return {
            type: config?.logarithmic_scale ? "log" : "value",
            name: config?.unit,
            nameGap: config?.unit ? 2 : 0,
            nameTextStyle: { align: "left" },
            position: index === 0 ? "left" : "right",
            min,
            max,
            splitLine: { show: !config?.hide_grid },
            axisLabel: {
                formatter: (value) => formatNumber(value, hass),
            },
            scale: config?.fit_y_data ?? false,
            axisPointer: { show: false },
        };
    };
    const yAxis = [createAxis(leftConfig, 0)];
    if (usesRight) {
        yAxis.push(createAxis(rightConfig, 1));
    }
    return yAxis;
};

/**
 * Time selection: one click marks exactly one position of the chart.
 *
 * The selection is plain state of the card and plain data of the chart model -
 * nothing is pushed into the chart instance as an ECharts action. Every redraw
 * re-derives marker and dimming from the stored bucket, so a data refresh, a
 * theme switch or a live update can never lose the selection. It ends with the
 * page, not with a repaint.
 *
 * The marker is drawn as a line series of its own, not as `markArea` or
 * `markLine`: Home Assistant ships a tree-shaken ECharts build that registers
 * only the bar, line and custom charts, so the mark components do not exist and
 * their options are dropped without a word. A hidden `0..1` y axis lets that
 * series span the full plot height without touching the scale of the data axes.
 */
/**
 * Snaps a clicked x position onto an existing sample. A click may land
 * anywhere in the plotting area, so the closest sample of any series wins.
 */
const resolveBucket = (series, x) => {
    let bucket = null;
    let distance = Number.POSITIVE_INFINITY;
    series.forEach((serie) => {
        if (isSelectionSeries(serie) || !Array.isArray(serie.data)) {
            return;
        }
        serie.data.forEach((point) => {
            const tuple = toTuple(point);
            if (!tuple) {
                return;
            }
            const candidate = Math.abs(tuple[0] - x);
            if (candidate < distance) {
                distance = candidate;
                bucket = tuple[0];
            }
        });
    });
    return bucket;
};
/** First sample after `bucket` across all series - the end of a raw selection. */
const nextSampleAfter = (series, bucket) => {
    let next = null;
    series.forEach((serie) => {
        if (isSelectionSeries(serie) || !Array.isArray(serie.data)) {
            return;
        }
        serie.data.forEach((point) => {
            const tuple = toTuple(point);
            if (!tuple || tuple[0] <= bucket) {
                return;
            }
            if (next === null || tuple[0] < next) {
                next = tuple[0];
            }
        });
    });
    return next;
};
/**
 * Resolves a clicked x position into the period it selects.
 *
 * On a fixed grid the next bucket ends the period - the last one is closed by
 * advancing the aggregation period, so a bucket reaching past the visible end
 * keeps its full length. Without a grid (raw history) the next sample ends it.
 */
const resolveSelection = (x, { series, buckets, aggregation, displayEnd }) => {
    if (x === null) {
        return null;
    }
    const bucket = resolveBucket(series, x);
    if (bucket === null) {
        return null;
    }
    if (buckets?.length &&
        aggregation &&
        aggregation !== "raw" &&
        aggregation !== "disabled") {
        const index = buckets.indexOf(bucket);
        if (index >= 0) {
            const end = index + 1 < buckets.length
                ? buckets[index + 1]
                : advanceBucket(new Date(bucket), aggregation).getTime();
            return { bucket, start: bucket, end };
        }
    }
    return {
        bucket,
        start: bucket,
        end: nextSampleAfter(series, bucket) ?? displayEnd,
    };
};
/** Id prefix of every series that only exists to draw the selection. */
const SELECTION_ID_PREFIX = "__selection_";
/** Id of the series that draws the marker of the selected bucket. */
const SELECTION_SERIES_ID = `${SELECTION_ID_PREFIX}marker`;
/** Id of the hidden `0..1` axis the marker is drawn on. */
const SELECTION_AXIS_ID = `${SELECTION_ID_PREFIX}axis`;
/** True for the helper series of the selection, which carry no data of a series. */
const isSelectionSeries = (serie) => String(serie.id ?? "").startsWith(SELECTION_ID_PREFIX);
/**
 * The axis the marker is drawn on: hidden, fixed to `0..1`, so a marker value
 * of `1` reaches the top of the plot without changing the data axes. It is
 * always part of the option, whether something is selected or not, which keeps
 * the axis indices of the data series stable across redraws.
 */
const buildSelectionAxis = () => ({
    id: SELECTION_AXIS_ID,
    type: "value",
    show: false,
    min: 0,
    max: 1,
    scale: false,
    axisLabel: { show: false },
    splitLine: { show: false },
});
/**
 * Builds the visible marker: a dashed line over the full plot height at the
 * position of the selected bucket. It sits where the samples of that bucket sit
 * and therefore runs through the dots of the line series, and it is drawn above
 * the data so it stays readable over a bar.
 */
const buildSelectionMarker = ({ period, computedStyle, axisIndex, }) => {
    const color = computedStyle.getPropertyValue("--primary-color").trim() || "#03a9f4";
    return {
        id: SELECTION_SERIES_ID,
        name: "selection",
        type: "line",
        silent: true,
        animation: false,
        // Above bars and lines, which use the default z of 2.
        z: 3,
        xAxisIndex: 0,
        yAxisIndex: axisIndex,
        showSymbol: false,
        symbol: "none",
        lineStyle: { color, width: 2, type: [6, 4], cap: "butt" },
        data: [
            [period.start, 0],
            [period.start, 1],
        ],
    };
};

/**
 * Dimming for the time selection: everything that does not belong to the
 * selected bucket fades back, so the selection stands out.
 *
 * Bars are dimmed point by point, since only the bars outside the selected
 * bucket are unaffected by it. A line is drawn as one shape and has no
 * per-point opacity, so the whole line fades instead and its value at the
 * selected bucket is restated as a dot.
 *
 * That dot is a line series of its own holding a single point, not a
 * `markPoint`: the tree-shaken ECharts build of Home Assistant registers no
 * mark components, so a `markPoint` would be dropped silently.
 */
/** Opacity applied to everything outside the selection. */
const DIM_OPACITY = 0.5;
const MARK_SYMBOL_SIZE = 8;
const FILL_HELPER_PATTERN = /__fill_(base|area)$/u;
const dimmed = (style) => {
    const base = style ?? {};
    const current = typeof base.opacity === "number" ? base.opacity : 1;
    return { ...base, opacity: current * DIM_OPACITY };
};
const dimItem = (point, value) => {
    const item = Array.isArray(point)
        ? { value }
        : { ...point, value };
    item.itemStyle = dimmed(item.itemStyle);
    const label = item.label;
    if (label) {
        item.label = { ...label, opacity: DIM_OPACITY };
    }
    return item;
};
const valueAt = (serie, bucket) => {
    if (!Array.isArray(serie.data)) {
        return null;
    }
    for (const point of serie.data) {
        const tuple = toTuple(point);
        if (tuple && tuple[0] === bucket) {
            return tuple[1];
        }
    }
    return null;
};
const dimBarSeries = (serie, bucket) => {
    if (!Array.isArray(serie.data)) {
        return;
    }
    serie.data = serie.data.map((point) => {
        const tuple = toTuple(point);
        if (!tuple || tuple[0] === bucket) {
            return point;
        }
        return dimItem(point, tuple);
    });
};
/**
 * Y position of a value as it is drawn. A stacked line sits on the sum of the
 * series stacked below it, so the dot has to follow that sum instead of the
 * raw value.
 */
const stackedValueAt = (series, index, bucket) => {
    const target = series[index];
    const value = valueAt(target, bucket);
    if (value === null) {
        return null;
    }
    const stack = target.stack?.trim();
    if (!stack) {
        return value;
    }
    let sum = 0;
    for (let i = 0; i < index; i += 1) {
        const other = series[i];
        if (other.stack?.trim() !== stack || other.yAxisIndex !== target.yAxisIndex) {
            continue;
        }
        sum += valueAt(other, bucket) ?? 0;
    }
    return sum + value;
};
/**
 * The dot that restates the value of a faded line at the selected bucket. It
 * stays out of every stack and draws above the data.
 */
const buildSelectionDot = (serie, value, bucket, color) => ({
    id: `${SELECTION_ID_PREFIX}dot_${serie.id ?? bucket}`,
    name: `${serie.name ?? "selection"} (selected)`,
    type: "line",
    data: [[bucket, value]],
    xAxisIndex: serie.xAxisIndex ?? 0,
    yAxisIndex: serie.yAxisIndex ?? 0,
    symbol: "circle",
    symbolSize: MARK_SYMBOL_SIZE,
    showSymbol: true,
    showAllSymbol: true,
    lineStyle: { width: 0, opacity: 0 },
    // The dot stays at full strength while the line behind it is faded.
    itemStyle: color ? { color, opacity: 1 } : { opacity: 1 },
    z: (serie.z ?? 2) + 1,
    silent: true,
    animation: false,
});
/**
 * Fades a line as a whole and returns the dot for its value at the selected
 * bucket, if it has one.
 */
const dimLineSeries = (series, index, bucket) => {
    const serie = series[index];
    const lineStyle = serie.lineStyle;
    const areaStyle = serie.areaStyle;
    serie.lineStyle = dimmed(lineStyle);
    serie.itemStyle = dimmed(serie.itemStyle);
    if (areaStyle) {
        serie.areaStyle = dimmed(areaStyle);
    }
    // The invisible helpers of a fill band carry no value of their own.
    if (FILL_HELPER_PATTERN.test(String(serie.id ?? ""))) {
        return undefined;
    }
    const value = stackedValueAt(series, index, bucket);
    if (value === null) {
        return undefined;
    }
    const color = lineStyle?.color ??
        serie.color;
    return buildSelectionDot(serie, value, bucket, color);
};
/**
 * Fades everything outside the selected bucket. Runs after the bar styling,
 * whose per-item `itemStyle` is preserved, and leaves the helper series of the
 * selection itself untouched. Returns the dots of the faded lines, which the
 * caller appends to the series.
 */
const applySelectionDimming = (series, bucket) => {
    const dots = [];
    series.forEach((serie, index) => {
        if (isSelectionSeries(serie)) {
            return;
        }
        if (serie.type === "bar") {
            dimBarSeries(serie, bucket);
        }
        else if (serie.type === "line") {
            const dot = dimLineSeries(series, index, bucket);
            if (dot) {
                dots.push(dot);
            }
        }
    });
    return dots;
};

/**
 * Folds the separately loaded time-offset data into the regular inputs: shifted
 * statistics get a synthetic id so the builder can treat them like any other
 * series.
 */
const buildMainInputs = (config, snapshot, hass) => {
    const statistics = { ...(snapshot.main.statistics ?? {}) };
    const metadata = { ...snapshot.main.metadata };
    const calculated = new Map(snapshot.main.calculated);
    snapshot.shiftedCalculated.forEach((value, key) => calculated.set(key, value));
    const configSeries = config.series.map((series, index) => {
        const statisticId = getStatisticId(series);
        if (!getSeriesTimeOffset(series) || !statisticId) {
            return series;
        }
        const shiftedId = shiftedStatisticId(index, statisticId);
        statistics[shiftedId] = snapshot.shiftedStatistics.get(index) ?? [];
        const shiftedMetadata = snapshot.shiftedMetadata.get(index) ?? snapshot.main.metadata[statisticId];
        if (shiftedMetadata) {
            metadata[shiftedId] = { ...shiftedMetadata, statistic_id: shiftedId };
        }
        return {
            ...series,
            statistic_id: shiftedId,
            name: series.name ??
                hass.states[statisticId]?.attributes.friendly_name ??
                shiftedMetadata?.name ??
                statisticId,
        };
    });
    return { statistics, metadata, configSeries, calculated };
};
const compareDataIsCurrent = (snapshot) => !!snapshot.comparePeriodStart &&
    !!snapshot.compare.statistics &&
    snapshot.compare.range?.start === snapshot.comparePeriodStart.getTime() &&
    (snapshot.compare.range?.end ?? null) ===
        (snapshot.comparePeriodEnd?.getTime() ?? null);
const remapTimestamps = (serie, transform) => {
    if (!Array.isArray(serie.data)) {
        return;
    }
    serie.data = serie.data.map((point) => {
        const tuple = toTuple(point);
        if (!tuple) {
            return point;
        }
        const mapped = [transform(tuple[0]), tuple[1]];
        return Array.isArray(point) ? mapped : { ...point, value: mapped };
    });
};
const seriesHasValues = (series) => series.some((serie) => serie.data?.some((point) => {
    const tuple = toTuple(point);
    return !!tuple && tuple[1] !== null;
}));
/**
 * Builds the complete chart model: series for the visible range, optional
 * compare series, and the axis/grid options.
 */
const assembleChart = ({ hass, config, snapshot, computedStyle, darkMode, logger, selectedX = null, }) => {
    const { periodStart, periodEnd } = snapshot;
    if (!periodStart || !snapshot.main.statistics || !snapshot.main.range) {
        return undefined;
    }
    // Ignore stale data that belongs to a range the card has already left.
    if (snapshot.main.range.start !== periodStart.getTime() ||
        (snapshot.main.range.end ?? null) !== (periodEnd?.getTime() ?? null)) {
        return undefined;
    }
    const inputs = buildMainInputs(config, snapshot, hass);
    const colorCycle = config.color_cycle ?? [];
    const main = buildSeries({
        hass,
        configSeries: inputs.configSeries,
        statistics: inputs.statistics,
        metadata: inputs.metadata,
        calculatedData: inputs.calculated,
        colorCycle,
        darkMode,
        computedStyle,
        logger,
    });
    const configById = new Map(main.configById);
    const barLayout = new BarStackLayout();
    main.series.forEach((serie, index) => {
        if (serie.type === "bar") {
            barLayout.assignCurrent(serie, index);
        }
    });
    const compareSeries = [];
    if (compareDataIsCurrent(snapshot) && snapshot.comparePeriodStart) {
        const compare = buildSeries({
            hass,
            configSeries: inputs.configSeries,
            statistics: snapshot.compare.statistics,
            metadata: snapshot.compare.metadata,
            calculatedData: snapshot.compare.calculated,
            colorCycle,
            darkMode,
            computedStyle,
            logger,
        });
        const transform = createCompareTransform(periodStart, snapshot.comparePeriodStart);
        compare.series.forEach((serie, index) => {
            const baseId = serie.id ?? `compare_${index}`;
            const compareId = toCompareId(baseId);
            const cloned = { ...serie, id: compareId, name: `${serie.name ?? baseId} (compare)` };
            remapTimestamps(cloned, transform);
            const baseConfig = compare.configById.get(baseId) ??
                compare.configById.get(baseId.replace(/__fill_(base|area)$/u, ""));
            if (baseConfig) {
                configById.set(compareId, baseConfig);
            }
            const compareColorToken = resolveThemedColor(baseConfig?.compare_color, darkMode);
            const compareColor = compareColorToken
                ? resolveColorToken(compareColorToken, computedStyle)
                : undefined;
            if (cloned.type === "bar") {
                barLayout.assignCompare(cloned, baseId);
            }
            else if (cloned.stack?.trim()) {
                cloned.stack = `${cloned.stack.trim()}--compare`;
            }
            else {
                cloned.stack = `${compareId}--stack`;
            }
            styleCompareSeries(cloned, compareColor);
            cloned.z = Math.max((cloned.z ?? 0) - 1, 0);
            compareSeries.push(cloned);
        });
    }
    const series = [
        ...barLayout.placeholders(),
        ...compareSeries,
        ...main.series,
    ];
    if (!series.length) {
        return undefined;
    }
    const displayEnd = periodEnd?.getTime() ?? snapshot.main.range.end ?? null;
    const buckets = buildBucketSequence(periodStart.getTime(), displayEnd, snapshot.main.aggregation);
    if (buckets?.length) {
        normalizeLineSeries(series, buckets);
    }
    extendLineSeries(series, {
        displayEnd,
        // Compare data was already remapped onto the visible range.
        compareDisplayEnd: displayEnd,
        extendMain: snapshot.main.aggregation === "raw",
        extendCompare: snapshot.compare.aggregation === "raw",
        chartTypeOf: (id) => configById.get(toBaseId(id ?? ""))?.chart_type ?? configById.get(id ?? "")?.chart_type,
        isCompare: (id) => !!id && isCompareId(id),
    });
    applyBarStyling(series, {
        buckets,
        configById,
        valueLabelColor: computedStyle.getPropertyValue("--primary-text-color").trim() || "#000",
        formatValue: (value, precision) => formatNumber(value, hass, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        }),
        logger,
    });
    // The selection is derived from the data of this assembly, so a refresh keeps
    // marker and dimming in place as long as the bucket still exists.
    const selection = resolveSelection(selectedX, {
        series,
        buckets,
        aggregation: snapshot.main.aggregation,
        displayEnd,
    });
    // The hidden marker axis is always appended, so the axis indices of the data
    // series never shift between a selected and a cleared chart.
    const yAxis = [
        ...buildYAxes({
            axes: config.y_axes ?? [],
            seriesConfigs: config.series,
            series,
            hass,
        }),
        buildSelectionAxis(),
    ];
    if (selection) {
        const dots = applySelectionDimming(series, selection.bucket);
        series.push(buildSelectionMarker({
            period: selection,
            computedStyle,
            axisIndex: yAxis.length - 1,
        }), ...dots);
    }
    const options = {
        xAxis: buildXAxis({
            start: periodStart,
            end: periodEnd,
            aggregation: snapshot.main.aggregation,
            buckets,
            fallbackEnd: snapshot.main.range.end,
            hass,
        }),
        yAxis,
        grid: { top: 15, left: 1, right: 1, bottom: 0, containLabel: true },
        // This card renders neither a legend nor a tooltip or axis pointers.
        legend: { show: false },
        tooltip: { show: false, showContent: false, axisPointer: { type: "none" } },
    };
    return { series, options, hasData: seriesHasValues(series), selection };
};

/**
 * Where a click landed on the time axis.
 *
 * The card renders no tooltip and no axis pointer, so the click position is
 * taken from the chart itself: the zrender layer of the ECharts instance
 * reports clicks anywhere inside the canvas, and `convertFromPixel` turns the
 * pixel into a value of the time axis. That is a direct read of the click and
 * needs neither a tooltip formatter nor the transient axis pointer state.
 *
 * Home Assistant creates the instance inside `<ha-chart-base>` lazily, so the
 * subscription is made on the way into a click: `pointerdown` runs before the
 * click is handled, and by then the chart certainly exists. Versions without a
 * reachable instance fall back to the `chart-click` event of the element.
 */
class SelectionInput {
    constructor(_onPick, _logger) {
        this._onPick = _onPick;
        this._logger = _logger;
        this._onZrClick = (event) => {
            const chart = this._chart;
            if (!chart) {
                return;
            }
            const pixel = [event.offsetX, event.offsetY];
            // Clicks on the axis labels or beside the plot select nothing.
            if (typeof chart.containPixel === "function" &&
                !chart.containPixel({ gridIndex: 0 }, pixel)) {
                return;
            }
            const converted = chart.convertFromPixel({ xAxisIndex: 0 }, pixel[0]);
            const x = Array.isArray(converted) ? converted[0] : converted;
            if (typeof x === "number" && Number.isFinite(x)) {
                this._onPick(x);
            }
        };
    }
    /** True once a chart instance is hooked; the fallback stays silent then. */
    get hooked() {
        return this._chart !== undefined;
    }
    /** Subscribes to the chart of `host`, replacing an earlier subscription. */
    attach(host) {
        const chart = host?.chart;
        if (!chart || typeof chart.getZr !== "function") {
            this._logger.warnOnce("no-chart-instance", "<ha-chart-base> exposes no chart instance; falling back to chart-click.");
            return;
        }
        if (chart === this._chart) {
            return;
        }
        // A rebuilt chart is a new instance, so the old subscription is dropped.
        this.detach();
        this._chart = chart;
        this._zr = chart.getZr();
        this._zr?.on("click", this._onZrClick);
    }
    detach() {
        this._zr?.off("click", this._onZrClick);
        this._zr = undefined;
        this._chart = undefined;
    }
    /** Fallback: `<ha-chart-base>` reports a click that hit a data item. */
    handleChartClick(event) {
        if (this.hooked) {
            return;
        }
        const detail = event.detail;
        const value = Array.isArray(detail?.value) ? detail?.value[0] : undefined;
        if (typeof value === "number" && Number.isFinite(value)) {
            this._onPick(value);
        }
    }
}

/** The released version — what `package.json` says, without the build counter */
/** `<semver>+build.<n>` — what the card reports in the console */
const CARD_VERSION = "0.0.1" ;

/** Name of the event the card fires whenever the selected period changes. */
const SELECTION_EVENT = "custom-graph-selection";
const DISABLED_MESSAGE = "Fetching statistics is disabled for this period. Choose a shorter time range.";
console.info("%c CUSTOM-GRAPH-CARD %c " + CARD_VERSION + " ", "background-color: #000000; color: #4CAF50; font-weight: bold;", "background-color: #666666; color: #FFFFFF; font-weight: bold;");
let CustomGraphCard = class CustomGraphCard extends s {
    constructor() {
        super(...arguments);
        this._chartData = [];
        this._hasData = false;
        this._loading = false;
        this._disabled = false;
        this._usesSectionLayout = false;
        this._logger = new OnceLogger();
        this._controller = new GraphDataController(() => this._onData());
        this._darkMode = false;
        /** The one selected x value; `null` while nothing is selected. */
        this._selectedX = null;
        /** Bucket and period of the last assembly, used to toggle and to report. */
        this._selection = null;
        /** Series of the last assembly; a click is snapped against them. */
        this._assembledSeries = [];
        /** Last reported selection; guards the event against repeated payloads. */
        this._emitted = {
            start: null,
            end: null,
        };
        this._selectionInput = new SelectionInput((x) => this._onPick(x), this._logger);
        /** Home Assistant creates the chart lazily; a click proves it exists. */
        this._attachSelectionInput = () => {
            this._selectionInput.attach(this.renderRoot?.querySelector("ha-chart-base"));
        };
        this._onChartClick = (event) => {
            this._selectionInput.handleChartClick(event);
        };
    }
    /**
     * Lit runs `willUpdate` only for updates that `shouldUpdate` let through, and
     * this card drops plain entity-state updates - it is driven by statistics,
     * not by states. Handing `hass` on from there would therefore have skipped
     * most of them and left the controller holding an object that grows
     * arbitrarily old, including its websocket connection. The controller is fed
     * from the setter instead, so it always has the current one, while the render
     * path keeps ignoring the updates it has no use for.
     */
    set hass(hass) {
        const previous = this._hass;
        this._hass = hass;
        this._controller.setHass(hass);
        this.requestUpdate("hass", previous);
    }
    get hass() {
        return this._hass;
    }
    setConfig(config) {
        this._config = normalizeConfig(config);
        this._logger.reset();
        this._renderedRange = undefined;
        this._clearSelection();
        this._controller.setConfig(this._config);
    }
    static getStubConfig() {
        return { type: "custom:custom-graph-card", series: [] };
    }
    getCardSize() {
        return 5;
    }
    getGridOptions() {
        const hasTitle = !!this._config?.title?.trim();
        return {
            columns: 12,
            min_columns: 6,
            rows: hasTitle ? 5 : 4,
            min_rows: hasTitle ? 4 : 3,
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this._controller.connect();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._controller.disconnect();
        this._selectionInput.detach();
        if (this._animationFrame !== undefined) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = undefined;
        }
    }
    shouldUpdate(changedProps) {
        if (!changedProps.has("hass") || changedProps.size > 1) {
            return true;
        }
        // Ignore plain entity state updates; the card is driven by statistics.
        const oldHass = changedProps.get("hass");
        if (!oldHass) {
            return true;
        }
        return (oldHass.connected !== this.hass?.connected ||
            oldHass.themes !== this.hass?.themes ||
            oldHass.locale !== this.hass?.locale);
    }
    updated(changedProps) {
        super.updated(changedProps);
        this._evaluateSectionLayout();
        // A theme switch changes every resolved color, so the chart is rebuilt.
        const darkMode = this._isDarkMode();
        const themeChanged = darkMode !== this._darkMode;
        this._darkMode = darkMode;
        if (changedProps.has("_config") || themeChanged) {
            this._rebuildChart();
        }
    }
    firstUpdated() {
        this._evaluateSectionLayout();
    }
    _onData() {
        const snapshot = this._controller.snapshot;
        this._loading = snapshot.loading;
        this._disabled = snapshot.aggregationDisabled;
        this._rebuildChart();
    }
    /** Section layouts size the card through grid rows instead of `chart_height`. */
    _evaluateSectionLayout() {
        if (!this.isConnected) {
            return;
        }
        const layout = this.layout;
        this._usesSectionLayout = layout === "grid";
    }
    /**
     * A click was placed in the plotting area. The x value is snapped onto a
     * bucket first, so clicking the selected one again clears it - which keeps
     * exactly one selection alive without any timing heuristics.
     */
    _onPick(x) {
        const bucket = resolveBucket(this._assembledSeries, x);
        if (bucket === null) {
            return;
        }
        this._selectedX = bucket === this._selection?.bucket ? null : bucket;
        this._rebuildChart();
    }
    _clearSelection() {
        this._selectedX = null;
        this._selection = null;
        this._selectedRange = undefined;
    }
    /**
     * The selection belongs to one visible range: it survives refreshes, live
     * updates and redraws, but a switch of the range points at a period the
     * chart no longer shows.
     */
    _dropSelectionOnRangeChange(range) {
        if (this._selectedX === null || !this._selectedRange) {
            return;
        }
        if (this._selectedRange.start !== range.start ||
            this._selectedRange.end !== range.end) {
            this._clearSelection();
        }
    }
    /**
     * Reports the selected period as a {@link SELECTION_EVENT} whenever it
     * changed, so dashboards can react to it. The event bubbles out of the
     * shadow root; clearing the selection reports a payload of `null`s.
     */
    _emitSelection(period) {
        const start = period?.start ?? null;
        const end = period?.end ?? null;
        if (start === this._emitted.start && end === this._emitted.end) {
            return;
        }
        this._emitted = { start, end };
        this.dispatchEvent(new CustomEvent(SELECTION_EVENT, {
            detail: {
                start,
                end,
                startTime: start === null ? null : new Date(start).toISOString(),
                endTime: end === null ? null : new Date(end).toISOString(),
            },
            bubbles: true,
            composed: true,
        }));
    }
    /**
     * True while the loaded data still belongs to a range the card has left -
     * the one case in which "nothing to assemble" means "not yet" rather than
     * "there is nothing".
     */
    _dataIsStale(snapshot) {
        const range = snapshot.main.range;
        if (!snapshot.periodStart || !range) {
            return false;
        }
        return (range.start !== snapshot.periodStart.getTime() ||
            (range.end ?? null) !== (snapshot.periodEnd?.getTime() ?? null));
    }
    _rebuildChart() {
        if (!this.hass || !this._config) {
            return;
        }
        const snapshot = this._controller.snapshot;
        if (snapshot.periodStart) {
            this._dropSelectionOnRangeChange({
                start: snapshot.periodStart.getTime(),
                end: snapshot.periodEnd?.getTime() ?? null,
            });
        }
        const assembled = assembleChart({
            hass: this.hass,
            config: this._config,
            snapshot,
            computedStyle: this.isConnected
                ? getComputedStyle(this)
                : getComputedStyle(document.documentElement),
            darkMode: this._isDarkMode(),
            logger: this._logger,
            selectedX: this._selectedX,
        });
        if (!assembled) {
            // Data for the new range has not arrived yet, so there is nothing to
            // draw - but there is something drawn. Replacing it with the "no data"
            // placeholder for the length of a fetch reads as an error rather than as
            // loading, so the previous chart keeps standing. Only the selection goes:
            // it points at a period the card has left.
            const keepPreviousChart = this._hasData && this._dataIsStale(snapshot);
            this._assembledSeries = [];
            this._clearSelection();
            this._emitSelection(null);
            if (!keepPreviousChart) {
                this._chartData = [];
                this._chartOptions = undefined;
                this._hasData = false;
            }
            return;
        }
        const range = {
            start: snapshot.periodStart.getTime(),
            end: snapshot.periodEnd?.getTime() ?? null,
        };
        this._assembledSeries = assembled.series;
        this._selection = assembled.selection;
        // The click may have snapped to a bucket of its own, so the stored value
        // follows the assembly - a later click on the same bucket then clears it.
        this._selectedX = assembled.selection?.bucket ?? null;
        this._selectedRange = assembled.selection ? range : undefined;
        this._emitSelection(assembled.selection);
        const rangeChanged = !this._renderedRange ||
            this._renderedRange.start !== range.start ||
            this._renderedRange.end !== range.end;
        this._hasData = assembled.hasData;
        // Growing out of zero looks better than morphing the previous range's data
        // into the new one, so a range switch always animates from a flat chart.
        this._chartOptions = { ...assembled.options, animation: rangeChanged };
        if (!rangeChanged) {
            this._chartData = assembled.series;
            return;
        }
        this._chartData = createZeroSnapshot(assembled.series);
        if (this._animationFrame !== undefined) {
            cancelAnimationFrame(this._animationFrame);
        }
        this._animationFrame = requestAnimationFrame(() => {
            this._animationFrame = undefined;
            this._chartData = assembled.series;
            this._renderedRange = range;
        });
    }
    _isDarkMode() {
        return (this.hass?.themes?.darkMode === true);
    }
    _localize(key, fallback) {
        const localized = this.hass?.localize?.(key);
        return localized?.trim() ? localized : fallback;
    }
    render() {
        if (!this.hass || !this._config) {
            return A;
        }
        const hasTitle = !!this._config.title?.trim();
        return x `
      <ha-card>
        ${hasTitle
            ? x `<h1 class="card-header">${this._config.title}</h1>`
            : A}
        <div
          class=${o({ content: true, "content--no-title": !hasTitle })}
        >
          ${this._renderChart()}
        </div>
      </ha-card>
    `;
    }
    _renderChart() {
        if (this._loading) {
            return x `<div class="placeholder">
        ${this._localize("ui.components.statistics_charts.loading_statistics", "Loading statistics…")}
      </div>`;
        }
        if (this._disabled) {
            return x `<div class="placeholder">
        ${this._localize("ui.components.statistics_charts.choose_shorter_period", DISABLED_MESSAGE)}
      </div>`;
        }
        if (!this._hasData || !this._chartOptions) {
            return x `<div class="placeholder">
        ${this._localize("ui.components.statistics_charts.no_statistics_found", "No statistics available for the selected period")}
      </div>`;
        }
        const height = this._usesSectionLayout ? "100%" : this._config?.chart_height;
        return x `
      <div
        class=${o({
            chart: true,
            "chart--section": this._usesSectionLayout,
        })}
      >
        <ha-chart-base
          .hass=${this.hass}
          .data=${this._chartData}
          .options=${this._chartOptions}
          .height=${height}
          @pointerdown=${this._attachSelectionInput}
          @chart-click=${this._onChartClick}
        ></ha-chart-base>
      </div>
    `;
    }
};
CustomGraphCard.styles = i$3 `
    ha-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-header {
      margin: 0;
      padding: 16px 16px 0 16px;
    }

    .content {
      flex: 1;
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
    }

    .content--no-title {
      padding-top: 15px;
    }

    .chart {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .chart ha-chart-base {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      display: block;
    }

    .chart--section {
      --chart-max-height: none;
    }

    .chart--section ha-chart-base {
      height: 100%;
    }

    .placeholder {
      color: var(--secondary-text-color);
      font-style: italic;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 16px 8px;
    }
  `;
__decorate([
    n$1({ attribute: false })
], CustomGraphCard.prototype, "hass", null);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_config", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_chartData", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_chartOptions", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_hasData", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_loading", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_disabled", void 0);
__decorate([
    t$1()
], CustomGraphCard.prototype, "_usesSectionLayout", void 0);
CustomGraphCard = __decorate([
    e$2("custom-graph-card")
], CustomGraphCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "custom-graph-card",
    name: "Custom Graph",
    description: "Statistics chart with custom aggregation, stacking, axes and colors. YAML only.",
    documentationURL: "https://github.com/stefgo/ha-custom-graph",
});
//# sourceMappingURL=customgraph.js.map
