import{a as xt,c as Eg,e as Js}from"./chunk-RRU7Q3KP.js";var Z0={};Eg(Z0,{InferenceSession:()=>Ra,TRACE:()=>pr,TRACE_EVENT_BEGIN:()=>mt,TRACE_EVENT_END:()=>gt,TRACE_FUNC_BEGIN:()=>Xe,TRACE_FUNC_END:()=>qe,Tensor:()=>Ze,default:()=>K0,env:()=>be,registerBackend:()=>Ot});var Aa=Object.defineProperty,zg=Object.getOwnPropertyDescriptor,Cg=Object.getOwnPropertyNames,Ag=Object.prototype.hasOwnProperty,Og=(e=>typeof xt<"u"?xt:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof xt<"u"?xt:t)[r]}):e)(function(e){if(typeof xt<"u")return xt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),U=(e,t)=>()=>(e&&(t=e(e=0)),t),Gt=(e,t)=>{for(var r in t)Aa(e,r,{get:t[r],enumerable:!0})},Rg=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Cg(t))!Ag.call(e,a)&&a!==r&&Aa(e,a,{get:()=>t[a],enumerable:!(i=zg(t,a))||i.enumerable});return e},dr=e=>Rg(Aa({},"__esModule",{value:!0}),e),Zt,ct,Ot,eo,Bd,Nd=U(()=>{"use strict";Zt=new Map,ct=[],Ot=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Zt.get(e);if(i===void 0)Zt.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=ct.indexOf(e);a!==-1&&ct.splice(a,1);for(let n=0;n<ct.length;n++)if(Zt.get(ct[n]).priority<=r){ct.splice(n,0,e);return}ct.push(e)}return}throw new TypeError("not a valid backend")},eo=async e=>{let t=Zt.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Bd=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?ct:r,a,n=[],s=new Set;for(let l of i){let p=await eo(l);typeof p=="string"?n.push({name:l,err:p}):(a||(a=p),a===p&&s.add(l))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:p}of n)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${p}`);let u=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[a,new Proxy(e,{get:(l,p)=>p==="executionProviders"?u:Reflect.get(l,p)})]}}),Bg=U(()=>{"use strict";Nd()}),Md,Ng=U(()=>{"use strict";Md="1.27.0"}),bi,ze,Dd=U(()=>{"use strict";Ng(),bi="warning",ze={wasm:{},webgl:{},webgpu:{},versions:{common:Md},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);bi=e}},get logLevel(){return bi}},Object.defineProperty(ze,"logLevel",{enumerable:!0})}),be,Mg=U(()=>{"use strict";Dd(),be=ze}),Ud,Pd,Dg=U(()=>{"use strict";Ud=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,n;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",u=t?.norm,l,p;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],0],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let m=n*a,h=0,g=m,_=m*2,y=-1;s==="RGBA"?(h=0,g=m,_=m*2,y=m*3):s==="RGB"?(h=0,g=m,_=m*2):s==="RBG"&&(h=0,_=m,g=m*2);for(let w=0;w<n;w++)for(let S=0;S<a;S++){let x=(e.data[h++]-p[0])*l[0],b=(e.data[g++]-p[1])*l[1],I=(e.data[_++]-p[2])*l[2],k=y===-1?255:(e.data[y++]-p[3])*l[3];i.fillStyle="rgba("+x+","+b+","+I+","+k+")",i.fillRect(S,w,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Pd=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,n,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let u=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,p,m;l===void 0||l.mean===void 0?p=[255,255,255,255]:typeof l.mean=="number"?p=[l.mean,l.mean,l.mean,l.mean]:(p=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(p[3]=l.mean[3])),l===void 0||l.bias===void 0?m=[0,0,0,0]:typeof l.bias=="number"?m=[l.bias,l.bias,l.bias,l.bias]:(m=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(m[3]=l.bias[3]));let h=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let g=4,_=0,y=1,w=2,S=3,x=0,b=h,I=h*2,k=-1;u==="RGBA"?(x=0,b=h,I=h*2,k=h*3):u==="RGB"?(x=0,b=h,I=h*2):u==="RBG"&&(x=0,I=h,b=h*2),i=r.createImageData(a,n);for(let E=0;E<n*a;_+=g,y+=g,w+=g,S+=g,E++)i.data[_]=(e.data[x++]-m[0])*p[0],i.data[y]=(e.data[b++]-m[1])*p[1],i.data[w]=(e.data[I++]-m[2])*p[2],i.data[S]=k===-1?255:(e.data[k++]-m[3])*p[3]}else throw new Error("Can not access image data");return i}}),Tr,qd,Ld,Wd,Vd,Gd,Ug=U(()=>{"use strict";Oa(),Tr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let u=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",p=r*i,m=l==="RGBA"?new Float32Array(p*4):new Float32Array(p*3),h=4,g=0,_=1,y=2,w=3,S=0,x=p,b=p*2,I=-1;u==="RGB"&&(h=3,g=0,_=1,y=2,w=-1),l==="RGBA"?I=p*3:l==="RBG"?(S=0,b=p,x=p*2):l==="BGR"&&(b=0,x=p,S=p*2);for(let k=0;k<p;k++,g+=h,y+=h,_+=h,w+=h)m[S++]=(e[g]+s[0])/n[0],m[x++]=(e[_]+s[1])/n[1],m[b++]=(e[y]+s[2])/n[2],I!==-1&&w!==-1&&(m[I++]=(e[w]+s[3])/n[3]);return l==="RGBA"?new Me("float32",m,[1,4,r,i]):new Me("float32",m,[1,3,r,i])},qd=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,u=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},p=m=>typeof HTMLCanvasElement<"u"&&m instanceof HTMLCanvasElement||m instanceof OffscreenCanvas?m.getContext("2d"):null;if(r){let m=l();m.width=e.width,m.height=e.height;let h=p(m);if(h!=null){let g=e.height,_=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(g=t.resizedHeight,_=t.resizedWidth),t!==void 0){if(u=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");u.tensorFormat="RGBA",u.height=g,u.width=_}else u.tensorFormat="RGBA",u.height=g,u.width=_;h.drawImage(e,0,0),s=h.getImageData(0,0,_,g).data}else throw new Error("Can not access image data")}else if(i){let m,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(m=t.resizedHeight,h=t.resizedWidth):(m=e.height,h=e.width),t!==void 0&&(u=t),u.format="RGBA",u.height=m,u.width=h,t!==void 0){let g=l();g.width=h,g.height=m;let _=p(g);if(_!=null)_.putImageData(e,0,0),s=_.getImageData(0,0,h,m).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let m=l();m.width=e.width,m.height=e.height;let h=p(m);if(h!=null){let g=e.height,_=e.width;return h.drawImage(e,0,0,_,g),s=h.getImageData(0,0,_,g).data,u.height=g,u.width=_,Tr(s,u)}else throw new Error("Can not access image data")}else{if(n)return new Promise((m,h)=>{let g=l(),_=p(g);if(!e||!_)return h();let y=new Image;y.crossOrigin="Anonymous",y.src=e,y.onload=()=>{g.width=y.width,g.height=y.height,_.drawImage(y,0,0,g.width,g.height);let w=_.getImageData(0,0,g.width,g.height);u.height=g.height,u.width=g.width,m(Tr(w.data,u))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Tr(s,u);throw new Error("Input data provided is not supported - aborted tensor creation")},Ld=(e,t)=>{let{width:r,height:i,download:a,dispose:n}=t,s=[1,i,r,4];return new Me({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},Wd=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Me({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:n})},Vd=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Me({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:n})},Gd=(e,t,r)=>new Me({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),zt,nr,$i,Hd,Pg=U(()=>{"use strict";zt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),nr=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),$i=!1,Hd=()=>{if(!$i){$i=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(zt.set("int64",BigInt64Array),nr.set(BigInt64Array,"int64")),t&&(zt.set("uint64",BigUint64Array),nr.set(BigUint64Array,"uint64")),i?(zt.set("float16",r),nr.set(r,"float16")):zt.set("float16",Uint16Array)}}}),Fd,jd,qg=U(()=>{"use strict";Oa(),Fd=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},jd=(e,t)=>{switch(e.location){case"cpu":return new Me(e.type,e.data,t);case"cpu-pinned":return new Me({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Me({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Me({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Me({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Me,Oa=U(()=>{"use strict";Dg(),Ug(),Pg(),qg(),Me=class{constructor(e,t,r){Hd();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=zt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,u;if(typeof e=="string")if(i=e,u=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=zt.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(u=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=nr.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(u===void 0)u=[s.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");a=u,this.cpuData=s,this.dataLocation="cpu"}let n=Fd(a);if(this.cpuData&&n!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=n}static async fromImage(e,t){return qd(e,t)}static fromTexture(e,t){return Ld(e,t)}static fromGpuBuffer(e,t){return Wd(e,t)}static fromMLTensor(e,t){return Vd(e,t)}static fromPinnedBuffer(e,t,r){return Gd(e,t,r)}toDataURL(e){return Ud(this,e)}toImageData(e){return Pd(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return jd(this,e)}}}),Ze,Kd=U(()=>{"use strict";Oa(),Ze=Me}),pr,wi,Xe,qe,mt,gt,Zd=U(()=>{"use strict";Dd(),pr=(e,t)=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.timeStamp(`${e}::ORT::${t}`)},wi=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let a=0;a<r.length;a++){if(i&&!r[a].includes("TRACE_FUNC")){let n=`FUNC_${e}::${r[a].trim().split(" ")[1]}`;t&&(n+=`::${t}`),pr("CPU",n);return}r[a].includes("TRACE_FUNC")&&(i=!0)}},Xe=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||wi("BEGIN",e)},qe=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||wi("END",e)},mt=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.time(`ORT::${e}`)},gt=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.timeEnd(`ORT::${e}`)}}),Xd,Lg=U(()=>{"use strict";Nd(),Kd(),Zd(),Xd=class Qd{constructor(t){this.handler=t}async run(t,r,i){Xe(),mt("InferenceSession.run");let a={},n={};if(typeof t!="object"||t===null||t instanceof Ze||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Ze)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let p of r){if(typeof p!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(p)===-1)throw new RangeError(`'fetches' contains invalid output name: ${p}.`);a[p]=null}if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let p=!1,m=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(m.indexOf(h)!==-1){let g=r[h];(g===null||g instanceof Ze)&&(p=!0,s=!1,a[h]=g)}if(p){if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else n=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let p of this.inputNames)if(typeof t[p]>"u")throw new Error(`input '${p}' is missing in 'feeds'.`);if(s)for(let p of this.outputNames)a[p]=null;let u=await this.handler.run(t,a,n),l={};for(let p in u)if(Object.hasOwnProperty.call(u,p)){let m=u[p];m instanceof Ze?l[p]=m:l[p]=new Ze(m.type,m.data,m.dims)}return gt("InferenceSession.run"),qe(),l}async release(){return this.handler.dispose()}static async create(t,r,i,a){Xe(),mt("InferenceSession.create");let n,s={};if(typeof t=="string"){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let m=t,h=0,g=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=m.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${m.byteLength}).`);if(g=t.byteLength-h,typeof i=="number"){if(g=i,!Number.isSafeInteger(g))throw new RangeError("'byteLength' must be an integer.");if(g<=0||h+g>m.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${m.byteLength-h}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(m,h,g)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[u,l]=await Bd(s),p=await u.createInferenceSessionHandler(n,l);return gt("InferenceSession.create"),qe(),new Qd(p)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Ra,Wg=U(()=>{"use strict";Lg(),Ra=Xd}),Vg=U(()=>{"use strict"}),Gg=U(()=>{"use strict"}),Hg=U(()=>{"use strict"}),Fg=U(()=>{"use strict"}),Yd={};Gt(Yd,{InferenceSession:()=>Ra,TRACE:()=>pr,TRACE_EVENT_BEGIN:()=>mt,TRACE_EVENT_END:()=>gt,TRACE_FUNC_BEGIN:()=>Xe,TRACE_FUNC_END:()=>qe,Tensor:()=>Ze,env:()=>be,registerBackend:()=>Ot});var Le=U(()=>{"use strict";Bg(),Mg(),Wg(),Kd(),Vg(),Gg(),Zd(),Hg(),Fg()}),Ba=U(()=>{"use strict"}),Jd={};Gt(Jd,{default:()=>ep});var vi,xi,ep,jg=U(()=>{"use strict";sf(),Mt(),Na(),vi="ort-wasm-proxy-worker",xi=globalThis.self?.name===vi,xi&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Ma(r.wasm).then(()=>{Ja(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:a}=r;en(a,i).then(()=>{postMessage({type:t})},n=>{postMessage({type:t,err:n})});break}case"copy-from":{let{buffer:i}=r,a=jr(i);postMessage({type:t,out:a});break}case"create":{let{model:i,options:a}=r;tn(i,a).then(n=>{postMessage({type:t,out:n})},n=>{postMessage({type:t,err:n})});break}case"release":rn(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:a,inputs:n,outputIndices:s,options:u}=r;an(i,a,n,s,new Array(s.length).fill(null),u).then(l=>{l.some(p=>p[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},sn([...n,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":nn(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),ep=xi?null:e=>new Worker(e??Ne,{type:"module",name:vi})}),tp={};Gt(tp,{default:()=>rp});async function to(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,a=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(o,d)=>{o.startsWith("./")&&(o=o.substring(2)),(t.Xc||(t.Xc=new Map)).set(o,d)},t.unmountExternalData=()=>{delete t.Xc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,shared:!0}).buffer.constructor;let n=o=>async(...d)=>{try{if(t.Yc)throw Error("Session already started");let f=t.Yc={Kd:d[0],errors:[]},c=await o(...d);if(t.Yc!==f)throw Error("Session mismatch");t.dd?.flush();let $=f.errors;if(0<$.length){let T=await Promise.all($);if(T=T.filter(C=>C),0<T.length)throw Error(T.join(`
`))}return c}finally{t.Yc=null}};t.jsepInit=(o,d)=>{if(o==="webgpu"){[t.dd,t.Ad,t.Ed,t.ed,t.Dd,t.$b,t.Fd,t.Hd,t.Bd,t.Cd,t.Gd]=d;let f=t.dd;t.jsepRegisterBuffer=(c,$,T,C)=>f.registerBuffer(c,$,T,C),t.jsepGetBuffer=c=>f.getBuffer(c),t.jsepCreateDownloader=(c,$,T)=>f.createDownloader(c,$,T),t.jsepOnCreateSession=c=>{f.onCreateSession(c)},t.jsepOnReleaseSession=c=>{f.onReleaseSession(c)},t.jsepOnRunStart=c=>f.onRunStart(c),t.Id=(c,$)=>{f.upload(c,$)}}else if(o==="webnn"){let f=d[0];[t.Sd,t.sd,t.webnnEnsureTensor,t.td,t.webnnDownloadTensor,t.Rd,t.webnnEnableTraceEvent]=d.slice(1),t.webnnReleaseTensorId=t.sd,t.webnnUploadTensor=t.td,t.webnnRegisterMLContext=t.Rd,t.webnnOnRunStart=c=>f.onRunStart(c),t.webnnOnRunEnd=f.onRunEnd.bind(f),t.webnnOnReleaseSession=c=>{f.onReleaseSession(c)},t.webnnCreateMLTensorDownloader=(c,$)=>f.createMLTensorDownloader(c,$),t.webnnRegisterMLTensor=(c,$,T,C)=>f.registerMLTensor(c,$,T,C),t.webnnCreateMLContext=c=>f.createMLContext(c),t.webnnRegisterMLConstant=(c,$,T,C,B,q)=>f.registerMLConstant(c,$,T,C,B,t.Xc,q),t.webnnRegisterGraphInput=f.registerGraphInput.bind(f),t.webnnIsGraphInput=f.isGraphInput.bind(f),t.webnnRegisterGraphOutput=f.registerGraphOutput.bind(f),t.webnnIsGraphOutput=f.isGraphOutput.bind(f),t.webnnCreateTemporaryTensor=f.createTemporaryTensor.bind(f),t.webnnIsGraphInputOutputTypeSupported=f.isGraphInputOutputTypeSupported.bind(f)}};let s=()=>{let o=d=>(...f)=>{let c=Ye;return f=d(...f),Ye!=c?new Promise(($,T)=>{si={resolve:$,reject:T}}):f};(()=>{for(let d of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[d]=o(t[d])})(),n!==void 0&&(t._OrtRun=n(t._OrtRun),t._OrtRunWithBinding=n(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var u,l,p=(o,d)=>{throw d},m=import.meta.url,h="";if(r||i){try{h=new URL(".",m).href}catch{}i&&(l=o=>{var d=new XMLHttpRequest;return d.open("GET",o,!1),d.responseType="arraybuffer",d.send(null),new Uint8Array(d.response)}),u=async o=>{if(O(o))return new Promise((f,c)=>{var $=new XMLHttpRequest;$.open("GET",o,!0),$.responseType="arraybuffer",$.onload=()=>{$.status==200||$.status==0&&$.response?f($.response):c($.status)},$.onerror=c,$.send(null)});var d=await fetch(o,{credentials:"same-origin"});if(d.ok)return d.arrayBuffer();throw Error(d.status+" : "+d.url)}}var g,_,y,w,S,x,b=console.log.bind(console),I=console.error.bind(console),k=b,E=I,z=!1,O=o=>o.startsWith("file://");function v(){ut.buffer!=X.buffer&&K()}if(a){let o=function(d){try{var f=d.data,c=f.Sc;if(c==="load"){let $=[];self.onmessage=T=>$.push(T),x=()=>{postMessage({Sc:"loaded"});for(let T of $)o(T);self.onmessage=o};for(let T of f.xd)t[T]&&!t[T].proxy||(t[T]=(...C)=>{postMessage({Sc:"callHandler",wd:T,args:C})},T=="print"&&(k=t[T]),T=="printErr"&&(E=t[T]));ut=f.Od,K(),_=f.Pd,ve(),kr()}else if(c==="run"){(function($){var T=(v(),P)[$+52>>>2>>>0];$=(v(),P)[$+56>>>2>>>0],ls(T,T-$),oe(T)})(f.Rc),pi(f.Rc,0,0,1,0,0),dn(),ii(f.Rc),L||(is(),L=!0);try{_f(f.Md,f.bd)}catch($){if($!="unwind")throw $}}else f.target!=="setimmediate"&&(c==="checkMailbox"?L&&_r():c&&(E(`worker: received unknown command ${c}`),E(f)))}catch($){throw as(),$}};var D=o,L=!1;self.onunhandledrejection=d=>{throw d.reason||d},self.onmessage=o}var X,W,F,se,A,P,J,te,Q,ae,M,Y=!1;function K(){var o=ut.buffer;t.HEAP8=X=new Int8Array(o),F=new Int16Array(o),t.HEAPU8=W=new Uint8Array(o),se=new Uint16Array(o),t.HEAP32=A=new Int32Array(o),t.HEAPU32=P=new Uint32Array(o),J=new Float32Array(o),te=new Float64Array(o),Q=new BigInt64Array(o),ae=new BigUint64Array(o)}function G(){Y=!0,a?x():rt.sb()}function $e(o){throw E(o="Aborted("+o+")"),z=!0,o=new WebAssembly.RuntimeError(o+". Build with -sASSERTIONS for more info."),S?.(o),o}function Ae(){return{a:{ma:Vm,gb:Wm,g:bf,J:$f,f:wf,o:vf,h:xf,ha:Sf,b:kf,T:Tf,Ha:gn,n:If,$:$n,Xa:wn,Da:vn,Fa:xn,Ya:Sn,Va:kn,Oa:Tn,Ua:In,ka:En,Ea:zn,Ba:Cn,Wa:An,Ca:On,bb:Ef,ea:Cf,wa:Af,ua:Rf,da:Nf,O:Mf,H:Df,va:Uf,_:Hf,xa:Ff,Ra:jf,za:Zf,Ia:Xf,sa:Qf,fa:Yf,Qa:ii,_a:Jf,R:im,r:um,c:ti,hb:lm,y:dm,M:pm,D:cm,l:hm,s:qn,ib:fm,I:mm,S:gm,j:ym,u:_m,q:bm,k:$m,La:wm,Ma:vm,Na:xm,Ja:Gn,Ka:Hn,ta:Fn,db:km,ab:Em,v:zm,aa:Cm,ga:Am,$a:Tm,W:Om,Za:Rm,Aa:Bm,F:Sm,U:Nm,la:xr,ya:Dm,fb:Mm,eb:Um,Sa:Xn,Ta:Qn,Ga:Xr,V:Yn,ja:Jn,Pa:es,ia:ts,kb:kg,na:$g,lb:Sg,oa:bg,G:dg,e:jm,t:Hm,w:Gm,B:ig,mb:gg,K:og,x:Xm,pa:yg,Y:wg,ba:mg,nb:fg,ob:hg,P:ag,qa:cg,pb:pg,N:ug,Z:_g,d:Fm,A:Zm,m:Km,jb:Tg,p:Ym,z:Jm,C:Qm,E:eg,L:ng,qb:lg,Q:vg,ca:sg,X:xg,rb:rg,ra:tg,i:qm,a:ut,cb:Zr}}}async function ve(){function o(c,$){var T=rt=c.exports;c={};for(let[C,B]of Object.entries(T))typeof B=="function"?(T=em(B),c[C]=T):c[C]=B;return rt=c,rt=(function(){var C=rt,B=V=>ne=>V(ne)>>>0,q=V=>()=>V()>>>0;return(C=Object.assign({},C)).tb=B(C.tb),C.Xb=q(C.Xb),C.Zb=B(C.Zb),C.lc=B(C.lc),C.mc=q(C.mc),C.qc=B(C.qc),C})(),un.push(rt._b),rs=(c=rt).tb,is=c.ub,t._OrtInit=c.vb,t._OrtGetLastError=c.wb,t._OrtCreateSessionOptions=c.xb,t._OrtAppendExecutionProvider=c.yb,t._OrtAddFreeDimensionOverride=c.zb,t._OrtAddSessionConfigEntry=c.Ab,t._OrtReleaseSessionOptions=c.Bb,t._OrtCreateSession=c.Cb,t._OrtReleaseSession=c.Db,t._OrtGetInputOutputCount=c.Eb,t._OrtGetInputOutputMetadata=c.Fb,t._OrtFree=c.Gb,t._OrtCreateTensor=c.Hb,t._OrtGetTensorData=c.Ib,t._OrtReleaseTensor=c.Jb,t._OrtCreateRunOptions=c.Kb,t._OrtAddRunConfigEntry=c.Lb,t._OrtReleaseRunOptions=c.Mb,t._OrtCreateBinding=c.Nb,t._OrtBindInput=c.Ob,t._OrtBindOutput=c.Pb,t._OrtClearBoundOutputs=c.Qb,t._OrtReleaseBinding=c.Rb,t._OrtRunWithBinding=c.Sb,t._OrtRun=c.Tb,t._OrtEndProfiling=c.Ub,t._JsepOutput=c.Vb,t._JsepGetNodeName=c.Wb,Sr=c.Xb,Je=t._free=c.Yb,jt=t._malloc=c.Zb,pi=c.ac,as=c.bc,ns=c.cc,ss=c.dc,ci=c.ec,os=c.fc,us=c.gc,le=c.hc,Kt=c.ic,ls=c.jc,oe=c.kc,hi=c.lc,ue=c.mc,ds=c.nc,fi=c.oc,ps=c.pc,cs=c.qc,hs=c.rc,mi=c.sc,fs=c.tc,ms=c.uc,gs=c.vc,ys=c.wc,_s=c.xc,bs=c.yc,$s=c.zc,ws=c.Ac,vs=c.Bc,xs=c.Cc,Ss=c.Dc,ks=c.Ec,Ts=c.Fc,Is=c.Gc,Es=c.Hc,zs=c.Ic,Cs=c.Jc,As=c.Kc,Os=c.Lc,Rs=c.Mc,Bs=c.Nc,Ns=c.Pc,Ms=c.Qc,Ds=c.$c,Us=c.ad,Ps=c.fd,qs=c.jd,Ls=c.kd,Ws=c.ld,Vs=c.md,Gs=c.nd,Hs=c.od,Fs=c.pd,js=c.qd,Ks=c.vd,Zs=c.Td,Xs=c.Ud,Qs=c.Vd,Ys=c.Wd,_=$,rt}var d,f=Ae();return t.instantiateWasm?new Promise(c=>{t.instantiateWasm(f,($,T)=>{c(o($,T))})}):a?o(new WebAssembly.Instance(_,Ae()),_):(M??(M=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",h):h+"ort-wasm-simd-threaded.jsep.wasm":new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href),d=await(async function(c){var $=M;if(!g&&!O($))try{var T=fetch($,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(T,c)}catch(C){E(`wasm streaming compile failed: ${C}`),E("falling back to ArrayBuffer instantiation")}return(async function(C,B){try{var q=await(async function(V){if(!g)try{var ne=await u(V);return new Uint8Array(ne)}catch{}if(V==M&&g)V=new Uint8Array(g);else{if(!l)throw"both async and sync fetching of the wasm failed";V=l(V)}return V})(C);return await WebAssembly.instantiate(q,B)}catch(V){E(`failed to asynchronously prepare wasm: ${V}`),$e(V)}})($,c)})(f),o(d.instance,d.module))}class Ee{constructor(d){Js(this,"name","ExitStatus");this.message=`Program terminated with exit(${d})`,this.status=d}}var me=o=>{o.terminate(),o.onmessage=()=>{}},xe=[],Be=0,bt=null,hr=o=>{ot.length==0&&(cn(),pn(ot[0]));var d=ot.pop();if(!d)return 6;Ht.push(d),$t[o.Rc]=d,d.Rc=o.Rc;var f={Sc:"run",Md:o.Ld,bd:o.bd,Rc:o.Rc};return d.postMessage(f,o.rd),0},st=0,we=(o,d,...f)=>{var c,$=16*f.length,T=ue(),C=hi($),B=C>>>3;for(c of f)typeof c=="bigint"?((v(),Q)[B++>>>0]=1n,(v(),Q)[B++>>>0]=c):((v(),Q)[B++>>>0]=0n,(v(),te)[B++>>>0]=c);return o=ns(o,0,$,C,d),oe(T),o};function Zr(o){if(a)return we(0,1,o);if(y=o,!(0<st)){for(var d of Ht)me(d);for(d of ot)me(d);ot=[],Ht=[],$t={},z=!0}p(0,new Ee(o))}function on(o){if(a)return we(1,0,o);Xr(o)}var Xr=o=>{if(y=o,a)throw on(o),"unwind";Zr(o)},ot=[],Ht=[],un=[],$t={},ln=o=>{var d=o.Rc;delete $t[d],ot.push(o),Ht.splice(Ht.indexOf(o),1),o.Rc=0,ss(d)};function dn(){un.forEach(o=>o())}var pn=o=>new Promise(d=>{o.onmessage=$=>{var T=$.data;if($=T.Sc,T.Zc&&T.Zc!=Sr()){var C=$t[T.Zc];C?C.postMessage(T,T.rd):E(`Internal error! Worker sent a message "${$}" to target pthread ${T.Zc}, but that thread no longer exists!`)}else $==="checkMailbox"?_r():$==="spawnThread"?hr(T):$==="cleanupThread"?yr(()=>{ln($t[T.Nd])}):$==="loaded"?(o.loaded=!0,d(o)):T.target==="setimmediate"?o.postMessage(T):$==="uncaughtException"?o.onerror(T.error):$==="callHandler"?t[T.wd](...T.args):$&&E(`worker sent an unknown command ${$}`)},o.onerror=$=>{throw E(`worker sent an error! ${$.filename}:${$.lineno}: ${$.message}`),$};var f,c=[];for(f of[])t.propertyIsEnumerable(f)&&c.push(f);o.postMessage({Sc:"load",xd:c,Od:ut,Pd:_})});function cn(){var o=new Worker((()=>{let d=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new d("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});ot.push(o)}var ut,_f=(o,d)=>{st=0,o=mi(o,d),0<st?y=o:ci(o)},fr=[],mr=0;function bf(o){var d=new Qr(o>>>=0);return(v(),X)[d.Tc+12>>>0]==0&&(hn(d,!0),mr--),fn(d,!1),fr.push(d),cs(o)}var Ut=0,$f=()=>{le(0,0);var o=fr.pop();ds(o.cd),Ut=0};function hn(o,d){d=d?1:0,(v(),X)[o.Tc+12>>>0]=d}function fn(o,d){d=d?1:0,(v(),X)[o.Tc+13>>>0]=d}class Qr{constructor(d){this.cd=d,this.Tc=d-24}}var Yr=o=>{var d=Ut;if(!d)return Kt(0),0;var f=new Qr(d);(v(),P)[f.Tc+16>>>2>>>0]=d;var c=(v(),P)[f.Tc+4>>>2>>>0];if(!c)return Kt(0),d;for(var $ of o){if($===0||$===c)break;if(ps($,c,f.Tc+16))return Kt($),d}return Kt(c),d};function wf(){return Yr([])}function vf(o){return Yr([o>>>0])}function xf(o,d,f,c){return Yr([o>>>0,d>>>0,f>>>0,c>>>0])}var Sf=()=>{var o=fr.pop();o||$e("no exception to throw");var d=o.cd;throw(v(),X)[o.Tc+13>>>0]==0&&(fr.push(o),fn(o,!0),hn(o,!1),mr++),fi(d),Ut=d};function kf(o,d,f){var c=new Qr(o>>>=0);throw d>>>=0,f>>>=0,(v(),P)[c.Tc+16>>>2>>>0]=0,(v(),P)[c.Tc+4>>>2>>>0]=d,(v(),P)[c.Tc+8>>>2>>>0]=f,fi(o),mr++,Ut=o}var Tf=()=>mr;function mn(o,d,f,c){return a?we(2,1,o,d,f,c):gn(o,d,f,c)}function gn(o,d,f,c){if(o>>>=0,d>>>=0,f>>>=0,c>>>=0,!globalThis.SharedArrayBuffer)return 6;var $=[];return a&&$.length===0?mn(o,d,f,c):(o={Ld:f,Rc:o,bd:c,rd:$},a?(o.Sc="spawnThread",postMessage(o,$),0):hr(o))}function If(o){throw Ut||(Ut=o>>>0),Ut}var yn=globalThis.TextDecoder&&new TextDecoder,_n=(o,d,f,c)=>{if(f=d+f,c)return f;for(;o[d]&&!(d>=f);)++d;return d},bn=(o,d=0,f,c)=>{if(16<(f=_n(o,d>>>=0,f,c))-d&&o.buffer&&yn)return yn.decode(o.buffer instanceof ArrayBuffer?o.subarray(d,f):o.slice(d,f));for(c="";d<f;){var $=o[d++];if(128&$){var T=63&o[d++];if((224&$)==192)c+=String.fromCharCode((31&$)<<6|T);else{var C=63&o[d++];65536>($=(240&$)==224?(15&$)<<12|T<<6|C:(7&$)<<18|T<<12|C<<6|63&o[d++])?c+=String.fromCharCode($):($-=65536,c+=String.fromCharCode(55296|$>>10,56320|1023&$))}}else c+=String.fromCharCode($)}return c},Te=(o,d,f)=>(o>>>=0)?bn((v(),W),o,d,f):"";function $n(o,d,f){return a?we(3,1,o,d,f):0}function wn(o,d){if(a)return we(4,1,o,d)}function vn(o,d){if(a)return we(5,1,o,d)}function xn(o,d,f){if(a)return we(6,1,o,d,f)}function Sn(o,d,f){return a?we(7,1,o,d,f):0}function kn(o,d){if(a)return we(8,1,o,d)}function Tn(o,d,f){if(a)return we(9,1,o,d,f)}function In(o,d,f,c){if(a)return we(10,1,o,d,f,c)}function En(o,d,f,c){if(a)return we(11,1,o,d,f,c)}function zn(o,d,f,c){if(a)return we(12,1,o,d,f,c)}function Cn(o){if(a)return we(13,1,o)}function An(o,d){if(a)return we(14,1,o,d)}function On(o,d,f){if(a)return we(15,1,o,d,f)}var Ef=()=>$e(""),Qe=o=>{o>>>=0;for(var d="";;){var f=(v(),W)[o++>>>0];if(!f)return d;d+=String.fromCharCode(f)}},Jr={},ei={},zf={},Pt=class extends Error{constructor(o){super(o),this.name="BindingError"}};function tt(o,d,f={}){return(function(c,$,T={}){var C=$.name;if(!c)throw new Pt(`type "${C}" must have a positive integer typeid pointer`);if(ei.hasOwnProperty(c)){if(T.yd)return;throw new Pt(`Cannot register type '${C}' twice`)}ei[c]=$,delete zf[c],Jr.hasOwnProperty(c)&&($=Jr[c],delete Jr[c],$.forEach(B=>B()))})(o,d,f)}var Rn=(o,d,f)=>{switch(d){case 1:return f?c=>(v(),X)[c>>>0]:c=>(v(),W)[c>>>0];case 2:return f?c=>(v(),F)[c>>>1>>>0]:c=>(v(),se)[c>>>1>>>0];case 4:return f?c=>(v(),A)[c>>>2>>>0]:c=>(v(),P)[c>>>2>>>0];case 8:return f?c=>(v(),Q)[c>>>3>>>0]:c=>(v(),ae)[c>>>3>>>0];default:throw new TypeError(`invalid integer width (${d}): ${o}`)}};function Cf(o,d,f,c,$){o>>>=0,f>>>=0,d=Qe(d>>>0);let T=C=>C;if(c=c===0n){let C=8*f;T=B=>BigInt.asUintN(C,B),$=T($)}tt(o,{name:d,Oc:T,Vc:(C,B)=>(typeof B=="number"&&(B=BigInt(B)),B),Uc:Rn(d,f,!c),Wc:null})}function Af(o,d,f,c){tt(o>>>=0,{name:d=Qe(d>>>0),Oc:function($){return!!$},Vc:function($,T){return T?f:c},Uc:function($){return this.Oc((v(),W)[$>>>0])},Wc:null})}var Bn=[],wt=[0,1,,1,null,1,!0,1,!1,1];function ti(o){9<(o>>>=0)&&--wt[o+1]===0&&(wt[o]=void 0,Bn.push(o))}var Ue=o=>{if(!o)throw new Pt(`Cannot use deleted val. handle = ${o}`);return wt[o]},We=o=>{switch(o){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let d=Bn.pop()||wt.length;return wt[d]=o,wt[d+1]=1,d}};function ri(o){return this.Oc((v(),P)[o>>>2>>>0])}var Of={name:"emscripten::val",Oc:o=>{var d=Ue(o);return ti(o),d},Vc:(o,d)=>We(d),Uc:ri,Wc:null};function Rf(o){return tt(o>>>0,Of)}var Bf=(o,d)=>{switch(d){case 4:return function(f){return this.Oc((v(),J)[f>>>2>>>0])};case 8:return function(f){return this.Oc((v(),te)[f>>>3>>>0])};default:throw new TypeError(`invalid float width (${d}): ${o}`)}};function Nf(o,d,f){f>>>=0,tt(o>>>=0,{name:d=Qe(d>>>0),Oc:c=>c,Vc:(c,$)=>$,Uc:Bf(d,f),Wc:null})}function Mf(o,d,f,c,$){o>>>=0,f>>>=0,d=Qe(d>>>0);let T=B=>B;if(c===0){var C=32-8*f;T=B=>B<<C>>>C,$=T($)}tt(o,{name:d,Oc:T,Vc:(B,q)=>q,Uc:Rn(d,f,c!==0),Wc:null})}function Df(o,d,f){function c(T){var C=(v(),P)[T>>>2>>>0];return T=(v(),P)[T+4>>>2>>>0],new $((v(),X).buffer,T,C)}var $=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][d];tt(o>>>=0,{name:f=Qe(f>>>0),Oc:c,Uc:c},{yd:!0})}var lt=(o,d,f)=>{var c=(v(),W);if(d>>>=0,0<f){var $=d;f=d+f-1;for(var T=0;T<o.length;++T){var C=o.codePointAt(T);if(127>=C){if(d>=f)break;c[d++>>>0]=C}else if(2047>=C){if(d+1>=f)break;c[d++>>>0]=192|C>>6,c[d++>>>0]=128|63&C}else if(65535>=C){if(d+2>=f)break;c[d++>>>0]=224|C>>12,c[d++>>>0]=128|C>>6&63,c[d++>>>0]=128|63&C}else{if(d+3>=f)break;c[d++>>>0]=240|C>>18,c[d++>>>0]=128|C>>12&63,c[d++>>>0]=128|C>>6&63,c[d++>>>0]=128|63&C,T++}}c[d>>>0]=0,o=d-$}else o=0;return o},gr=o=>{for(var d=0,f=0;f<o.length;++f){var c=o.charCodeAt(f);127>=c?d++:2047>=c?d+=2:55296<=c&&57343>=c?(d+=4,++f):d+=3}return d};function Uf(o,d){tt(o>>>=0,{name:d=Qe(d>>>0),Oc(f){var c=(v(),P)[f>>>2>>>0];return c=Te(f+4,c,!0),Je(f),c},Vc(f,c){c instanceof ArrayBuffer&&(c=new Uint8Array(c));var $=typeof c=="string";if(!($||ArrayBuffer.isView(c)&&c.BYTES_PER_ELEMENT==1))throw new Pt("Cannot pass non-string to std::string");var T=$?gr(c):c.length,C=jt(4+T+1),B=C+4;return(v(),P)[C>>>2>>>0]=T,$?lt(c,B,T+1):(v(),W).set(c,B>>>0),f!==null&&f.push(Je,C),C},Uc:ri,Wc(f){Je(f)}})}var Nn=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,Pf=(o,d,f)=>{if(o>>>=1,16<(d=_n((v(),se),o,d/2,f))-o&&Nn)return Nn.decode((v(),se).slice(o,d));for(f="";o<d;++o){var c=(v(),se)[o>>>0];f+=String.fromCharCode(c)}return f},qf=(o,d,f)=>{if(f??(f=2147483647),2>f)return 0;var c=d;f=(f-=2)<2*o.length?f/2:o.length;for(var $=0;$<f;++$){var T=o.charCodeAt($);(v(),F)[d>>>1>>>0]=T,d+=2}return(v(),F)[d>>>1>>>0]=0,d-c},Lf=o=>2*o.length,Wf=(o,d,f)=>{var c="";o>>>=2;for(var $=0;!($>=d/4);$++){var T=(v(),P)[o+$>>>0];if(!T&&!f)break;c+=String.fromCodePoint(T)}return c},Vf=(o,d,f)=>{if(d>>>=0,f??(f=2147483647),4>f)return 0;var c=d;f=c+f-4;for(var $=0;$<o.length;++$){var T=o.codePointAt($);if(65535<T&&$++,(v(),A)[d>>>2>>>0]=T,(d+=4)+4>f)break}return(v(),A)[d>>>2>>>0]=0,d-c},Gf=o=>{for(var d=0,f=0;f<o.length;++f)65535<o.codePointAt(f)&&f++,d+=4;return d};function Hf(o,d,f){if(o>>>=0,d>>>=0,f=Qe(f>>>=0),d===2)var c=Pf,$=qf,T=Lf;else c=Wf,$=Vf,T=Gf;tt(o,{name:f,Oc:C=>{var B=(v(),P)[C>>>2>>>0];return B=c(C+4,B*d,!0),Je(C),B},Vc:(C,B)=>{if(typeof B!="string")throw new Pt(`Cannot pass non-string to C++ string type ${f}`);var q=T(B),V=jt(4+q+d);return(v(),P)[V>>>2>>>0]=q/d,$(B,V+4,q+d),C!==null&&C.push(Je,V),V},Uc:ri,Wc(C){Je(C)}})}function Ff(o,d){tt(o>>>=0,{zd:!0,name:d=Qe(d>>>0),Oc:()=>{},Vc:()=>{}})}function jf(o){pi(o>>>0,!i,1,!r,131072,!1),dn()}var yr=o=>{if(!z)try{if(o(),!(0<st))try{a?Sr()&&ci(y):Xr(y)}catch(d){d instanceof Ee||d=="unwind"||p(0,d)}}catch(d){d instanceof Ee||d=="unwind"||p(0,d)}},Kf=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function ii(o){o>>>=0,Kf||(Atomics.waitAsync((v(),A),o>>>2,o).value.then(_r),o+=128,Atomics.store((v(),A),o>>>2,1))}var _r=()=>yr(()=>{var o=Sr();o&&(ii(o),us())});function Zf(o,d){(o>>>=0)==d>>>0?setTimeout(_r):a?postMessage({Zc:o,Sc:"checkMailbox"}):(o=$t[o])&&o.postMessage({Sc:"checkMailbox"})}var ai=[];function Xf(o,d,f,c,$){for(d>>>=0,$>>>=0,ai.length=0,f=$>>>3,c=$+c>>>3;f<c;){var T;T=(v(),Q)[f++>>>0]?(v(),Q)[f++>>>0]:(v(),te)[f++>>>0],ai.push(T)}return(d?gi[d]:Lm[o])(...ai)}var Qf=()=>{st=0};function Yf(o){o>>>=0,a?postMessage({Sc:"cleanupThread",Nd:o}):ln($t[o])}function Jf(o){}var br=o=>{try{o()}catch(d){$e(d)}};function em(o){var d=(...f)=>{$r.push(o);try{return o(...f)}finally{z||($r.pop(),Ye&&dt===1&&$r.length===0&&(dt=0,st+=1,br(Xs),typeof Fibers<"u"&&Fibers.Zd()))}};return Un.set(o,d),d}var dt=0,Ye=null,Mn=0,$r=[],ni=new Map,Dn=new Map,Un=new Map,tm=0,si=null,rm=[],Pn=o=>(function(d){if(!z){if(dt===0){var f=!1,c=!1;d(($=0)=>{if(!z&&(Mn=$,f=!0,c)){dt=2,br(()=>Qs(Ye)),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.resume(),$=!1;try{var T=(function(){var q=(v(),A)[Ye+8>>>2>>>0];return q=Dn.get(q),q=Un.get(q),--st,q()})()}catch(q){T=q,$=!0}var C=!1;if(!Ye){var B=si;B&&(si=null,($?B.reject:B.resolve)(T),C=!0)}if($&&!C)throw T}}),c=!0,f||(dt=1,Ye=(function(){var $=jt(65548),T=$+12;if((v(),P)[$>>>2>>>0]=T,(v(),P)[$+4>>>2>>>0]=T+65536,T=$r[0],!ni.has(T)){var C=tm++;ni.set(T,C),Dn.set(C,T)}return T=ni.get(T),(v(),A)[$+8>>>2>>>0]=T,$})(),typeof MainLoop<"u"&&MainLoop.ud&&MainLoop.pause(),br(()=>Zs(Ye)))}else dt===2?(dt=0,br(Ys),Je(Ye),Ye=null,rm.forEach(yr)):$e(`invalid state: ${dt}`);return Mn}})(d=>{o().then(d)});function im(o){return o>>>=0,Pn(async()=>{var d=await Ue(o);return We(d)})}var oi=[],am=o=>{var d=oi.length;return oi.push(o),d},nm=(o,d)=>{for(var f=Array(o),c=0;c<o;++c){var $=c,T=(v(),P)[d+4*c>>>2>>>0],C=ei[T];if(C===void 0)throw o=`parameter ${c}`,T=rs(T),d=Qe(T),Je(T),new Pt(`${o} has unknown type ${d}`);f[$]=C}return f},sm=(o,d,f)=>{var c=[];return o=o(c,f),c.length&&((v(),P)[d>>>2>>>0]=We(c)),o},om={},wr=o=>{var d=om[o];return d===void 0?Qe(o):d};function um(o,d,f){var[c,...$]=nm(o,d>>>0);d=c.Vc.bind(c);var T=$.map(q=>q.Uc.bind(q));o--;var C={toValue:Ue};switch(o=T.map((q,V)=>{var ne=`argFromPtr${V}`;return C[ne]=q,`${ne}(args${V?"+"+8*V:""})`}),f){case 0:var B="toValue(handle)";break;case 2:B="new (toValue(handle))";break;case 3:B="";break;case 1:C.getStringOrSymbol=wr,B="toValue(handle)[getStringOrSymbol(methodName)]"}return B+=`(${o})`,c.zd||(C.toReturnWire=d,C.emval_returnValue=sm,B=`return emval_returnValue(toReturnWire, destructorsRef, ${B})`),B=`return function (handle, methodName, destructorsRef, args) {
  ${B}
  }`,f=new Function(Object.keys(C),B)(...Object.values(C)),B=`methodCaller<(${$.map(q=>q.name)}) => ${c.name}>`,am(Object.defineProperty(f,"name",{value:B}))}function lm(o,d){return d>>>=0,(o=Ue(o>>>0))==Ue(d)}function dm(o){return(o>>>=0)?(o=wr(o),We(globalThis[o])):We(globalThis)}function pm(o){return o=wr(o>>>0),We(t[o])}function cm(o,d){return d>>>=0,o=Ue(o>>>0),d=Ue(d),We(o[d])}function hm(o){9<(o>>>=0)&&(wt[o+1]+=1)}function qn(o,d,f,c,$){return oi[o>>>0](d>>>0,f>>>0,c>>>0,$>>>0)}function fm(o,d,f,c,$){return qn(o>>>0,d>>>0,f>>>0,c>>>0,$>>>0)}function mm(){return We([])}function gm(o){o=Ue(o>>>0);for(var d=Array(o.length),f=0;f<o.length;f++)d[f]=o[f];return We(d)}function ym(o){return We(wr(o>>>0))}function _m(){return We({})}function bm(o){for(var d=Ue(o>>>=0);d.length;){var f=d.pop();d.pop()(f)}ti(o)}function $m(o,d,f){d>>>=0,f>>>=0,o=Ue(o>>>0),d=Ue(d),f=Ue(f),o[d]=f}function wm(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(v(),A)[d>>>2>>>0]=o.getUTCSeconds(),(v(),A)[d+4>>>2>>>0]=o.getUTCMinutes(),(v(),A)[d+8>>>2>>>0]=o.getUTCHours(),(v(),A)[d+12>>>2>>>0]=o.getUTCDate(),(v(),A)[d+16>>>2>>>0]=o.getUTCMonth(),(v(),A)[d+20>>>2>>>0]=o.getUTCFullYear()-1900,(v(),A)[d+24>>>2>>>0]=o.getUTCDay(),o=(o.getTime()-Date.UTC(o.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(v(),A)[d+28>>>2>>>0]=o}var Ln=o=>o%4==0&&(o%100!=0||o%400==0),Wn=[0,31,60,91,121,152,182,213,244,274,305,335],Vn=[0,31,59,90,120,151,181,212,243,273,304,334];function vm(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(v(),A)[d>>>2>>>0]=o.getSeconds(),(v(),A)[d+4>>>2>>>0]=o.getMinutes(),(v(),A)[d+8>>>2>>>0]=o.getHours(),(v(),A)[d+12>>>2>>>0]=o.getDate(),(v(),A)[d+16>>>2>>>0]=o.getMonth(),(v(),A)[d+20>>>2>>>0]=o.getFullYear()-1900,(v(),A)[d+24>>>2>>>0]=o.getDay();var f=(Ln(o.getFullYear())?Wn:Vn)[o.getMonth()]+o.getDate()-1|0;(v(),A)[d+28>>>2>>>0]=f,(v(),A)[d+36>>>2>>>0]=-60*o.getTimezoneOffset(),f=new Date(o.getFullYear(),6,1).getTimezoneOffset();var c=new Date(o.getFullYear(),0,1).getTimezoneOffset();o=0|(f!=c&&o.getTimezoneOffset()==Math.min(c,f)),(v(),A)[d+32>>>2>>>0]=o}function xm(o){o>>>=0;var d=new Date((v(),A)[o+20>>>2>>>0]+1900,(v(),A)[o+16>>>2>>>0],(v(),A)[o+12>>>2>>>0],(v(),A)[o+8>>>2>>>0],(v(),A)[o+4>>>2>>>0],(v(),A)[o>>>2>>>0],0),f=(v(),A)[o+32>>>2>>>0],c=d.getTimezoneOffset(),$=new Date(d.getFullYear(),6,1).getTimezoneOffset(),T=new Date(d.getFullYear(),0,1).getTimezoneOffset(),C=Math.min(T,$);return 0>f?(v(),A)[o+32>>>2>>>0]=+($!=T&&C==c):0<f!=(C==c)&&($=Math.max(T,$),d.setTime(d.getTime()+6e4*((0<f?C:$)-c))),(v(),A)[o+24>>>2>>>0]=d.getDay(),f=(Ln(d.getFullYear())?Wn:Vn)[d.getMonth()]+d.getDate()-1|0,(v(),A)[o+28>>>2>>>0]=f,(v(),A)[o>>>2>>>0]=d.getSeconds(),(v(),A)[o+4>>>2>>>0]=d.getMinutes(),(v(),A)[o+8>>>2>>>0]=d.getHours(),(v(),A)[o+12>>>2>>>0]=d.getDate(),(v(),A)[o+16>>>2>>>0]=d.getMonth(),(v(),A)[o+20>>>2>>>0]=d.getYear(),o=d.getTime(),BigInt(isNaN(o)?-1:o/1e3)}function Gn(o,d,f,c,$,T,C){return a?we(16,1,o,d,f,c,$,T,C):-52}function Hn(o,d,f,c,$,T){if(a)return we(17,1,o,d,f,c,$,T)}var Ft={},Sm=()=>performance.timeOrigin+performance.now();function Fn(o,d){if(a)return we(18,1,o,d);if(Ft[o]&&(clearTimeout(Ft[o].id),delete Ft[o]),!d)return 0;var f=setTimeout(()=>{delete Ft[o],yr(()=>os(o,performance.timeOrigin+performance.now()))},d);return Ft[o]={id:f,Yd:d},0}function km(o,d,f,c){o>>>=0,d>>>=0,f>>>=0,c>>>=0;var $=new Date().getFullYear(),T=new Date($,0,1).getTimezoneOffset();$=new Date($,6,1).getTimezoneOffset();var C=Math.max(T,$);(v(),P)[o>>>2>>>0]=60*C,(v(),A)[d>>>2>>>0]=+(T!=$),o=(d=B=>{var q=Math.abs(B);return`UTC${0<=B?"-":"+"}${String(Math.floor(q/60)).padStart(2,"0")}${String(q%60).padStart(2,"0")}`})(T),d=d($),$<T?(lt(o,f,17),lt(d,c,17)):(lt(o,c,17),lt(d,f,17))}var Tm=()=>Date.now(),Im=1;function Em(o,d,f){if(f>>>=0,!(0<=o&&3>=o))return 28;if(o===0)o=Date.now();else{if(!Im)return 52;o=performance.timeOrigin+performance.now()}return o=Math.round(1e6*o),(v(),Q)[f>>>3>>>0]=BigInt(o),0}var ui=[],jn=(o,d)=>{ui.length=0;for(var f;f=(v(),W)[o++>>>0];){var c=f!=105;d+=(c&=f!=112)&&d%8?4:0,ui.push(f==112?(v(),P)[d>>>2>>>0]:f==106?(v(),Q)[d>>>3>>>0]:f==105?(v(),A)[d>>>2>>>0]:(v(),te)[d>>>3>>>0]),d+=c?8:4}return ui};function zm(o,d,f){return o>>>=0,d=jn(d>>>0,f>>>0),gi[o](...d)}function Cm(o,d,f){return o>>>=0,d=jn(d>>>0,f>>>0),gi[o](...d)}var Am=()=>{};function Om(o,d){return E(Te(o>>>0,d>>>0))}var Rm=()=>{throw st+=1,"unwind"};function Bm(){return 4294901760}var Nm=()=>navigator.hardwareConcurrency,vt={},vr=o=>{var d;return(d=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(o))?+d[1]:(d=/:(\d+):\d+(?:\)|$)/.exec(o))?2147483648|+d[1]:0},Kn=o=>{for(var d of o)(o=vr(d))&&(vt[o]=d)};function Mm(){var o=Error().stack.toString().split(`
`);return o[0]=="Error"&&o.shift(),Kn(o),vt.gd=vr(o[3]),vt.Jd=o,vt.gd}function xr(o){if(!(o=vt[o>>>0]))return 0;var d;if(d=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(o))o=d[1];else if(d=/^\s+at (.*) \(.*\)$/.exec(o))o=d[1];else{if(!(d=/^(.+?)@/.exec(o)))return 0;o=d[1]}Je(xr.hd??0),d=gr(o)+1;var f=jt(d);return f&&lt(o,f,d),xr.hd=f,xr.hd}function Dm(o){o>>>=0;var d=(v(),W).length;if(o<=d||4294901760<o)return!1;for(var f=1;4>=f;f*=2){var c=d*(1+.2/f);c=Math.min(c,o+100663296);e:{c=(Math.min(4294901760,65536*Math.ceil(Math.max(o,c)/65536))-ut.buffer.byteLength+65535)/65536|0;try{ut.grow(c),K();var $=1;break e}catch{}$=void 0}if($)return!0}return!1}function Um(o,d,f){if(o>>>=0,d>>>=0,vt.gd==o)var c=vt.Jd;else(c=Error().stack.toString().split(`
`))[0]=="Error"&&c.shift(),Kn(c);for(var $=3;c[$]&&vr(c[$])!=o;)++$;for(o=0;o<f&&c[o+$];++o)(v(),A)[d+4*o>>>2>>>0]=vr(c[o+$]);return o}var li,di={},Zn=()=>{if(!li){var o,d={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(o in di)di[o]===void 0?delete d[o]:d[o]=di[o];var f=[];for(o in d)f.push(`${o}=${d[o]}`);li=f}return li};function Xn(o,d){if(a)return we(19,1,o,d);o>>>=0,d>>>=0;var f,c=0,$=0;for(f of Zn()){var T=d+c;(v(),P)[o+$>>>2>>>0]=T,c+=lt(f,T,1/0)+1,$+=4}return 0}function Qn(o,d){if(a)return we(20,1,o,d);o>>>=0,d>>>=0;var f=Zn();for(var c of((v(),P)[o>>>2>>>0]=f.length,o=0,f))o+=gr(c)+1;return(v(),P)[d>>>2>>>0]=o,0}function Yn(o){return a?we(21,1,o):52}function Jn(o,d,f,c){return a?we(22,1,o,d,f,c):52}function es(o,d,f,c){return a?we(23,1,o,d,f,c):70}var Pm=[null,[],[]];function ts(o,d,f,c){if(a)return we(24,1,o,d,f,c);d>>>=0,f>>>=0,c>>>=0;for(var $=0,T=0;T<f;T++){var C=(v(),P)[d>>>2>>>0],B=(v(),P)[d+4>>>2>>>0];d+=8;for(var q=0;q<B;q++){var V=o,ne=(v(),W)[C+q>>>0],pe=Pm[V];ne===0||ne===10?((V===1?k:E)(bn(pe)),pe.length=0):pe.push(ne)}$+=B}return(v(),P)[c>>>2>>>0]=$,0}function qm(o){return o>>>0}a||(function(){for(var o=t.numThreads-1;o--;)cn();xe.push(async()=>{var d=(async function(){if(!a)return Promise.all(ot.map(pn))})();Be++,await d,--Be==0&&bt&&(d=bt,bt=null,d())})})(),a||(ut=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),K()),t.wasmBinary&&(g=t.wasmBinary),t.stackSave=()=>ue(),t.stackRestore=o=>oe(o),t.stackAlloc=o=>hi(o),t.setValue=function(o,d,f="i8"){switch(f.endsWith("*")&&(f="*"),f){case"i1":case"i8":(v(),X)[o>>>0]=d;break;case"i16":(v(),F)[o>>>1>>>0]=d;break;case"i32":(v(),A)[o>>>2>>>0]=d;break;case"i64":(v(),Q)[o>>>3>>>0]=BigInt(d);break;case"float":(v(),J)[o>>>2>>>0]=d;break;case"double":(v(),te)[o>>>3>>>0]=d;break;case"*":(v(),P)[o>>>2>>>0]=d;break;default:$e(`invalid type for setValue: ${f}`)}},t.getValue=function(o,d="i8"){switch(d.endsWith("*")&&(d="*"),d){case"i1":case"i8":return(v(),X)[o>>>0];case"i16":return(v(),F)[o>>>1>>>0];case"i32":return(v(),A)[o>>>2>>>0];case"i64":return(v(),Q)[o>>>3>>>0];case"float":return(v(),J)[o>>>2>>>0];case"double":return(v(),te)[o>>>3>>>0];case"*":return(v(),P)[o>>>2>>>0];default:$e(`invalid type for getValue: ${d}`)}},t.UTF8ToString=Te,t.stringToUTF8=lt,t.lengthBytesUTF8=gr;var rs,is,Sr,Je,jt,pi,as,ns,ss,ci,os,us,le,Kt,ls,oe,hi,ue,ds,fi,ps,cs,hs,mi,fs,ms,gs,ys,_s,bs,$s,ws,vs,xs,Ss,ks,Ts,Is,Es,zs,Cs,As,Os,Rs,Bs,Ns,Ms,Ds,Us,Ps,qs,Ls,Ws,Vs,Gs,Hs,Fs,js,Ks,Zs,Xs,Qs,Ys,rt,Lm=[Zr,on,mn,$n,wn,vn,xn,Sn,kn,Tn,In,En,zn,Cn,An,On,Gn,Hn,Fn,Xn,Qn,Yn,Jn,es,ts],gi={1003524:(o,d,f,c,$)=>{if(t===void 0||!t.Xc)return 1;if((o=Te(Number(o>>>0))).startsWith("./")&&(o=o.substring(2)),!(o=t.Xc.get(o)))return 2;if(d=Number(d>>>0),f=Number(f>>>0),c=Number(c>>>0),d+f>o.byteLength)return 3;try{let T=o.subarray(d,d+f);switch($){case 0:(v(),W).set(T,c>>>0);break;case 1:t.Qd?t.Qd(c,T):t.Id(c,T);break;default:return 4}return 0}catch{return 4}},1004348:(o,d,f)=>{t.td(o,(v(),W).subarray(d>>>0,d+f>>>0))},1004412:()=>t.Sd(),1004454:o=>{t.sd(o)},1004491:()=>{t.Bd()},1004522:()=>{t.Cd()},1004551:()=>{t.Gd()},1004576:o=>t.Ad(o),1004609:o=>t.Ed(o),1004641:(o,d,f)=>{t.ed(Number(o),Number(d),Number(f),!0)},1004704:(o,d,f)=>{t.ed(Number(o),Number(d),Number(f))},1004761:()=>typeof wasmOffsetConverter<"u",1004818:o=>{t.$b("Abs",o,void 0)},1004869:o=>{t.$b("Neg",o,void 0)},1004920:o=>{t.$b("Floor",o,void 0)},1004973:o=>{t.$b("Ceil",o,void 0)},1005025:o=>{t.$b("Reciprocal",o,void 0)},1005083:o=>{t.$b("Sqrt",o,void 0)},1005135:o=>{t.$b("Exp",o,void 0)},1005186:o=>{t.$b("Erf",o,void 0)},1005237:o=>{t.$b("Sigmoid",o,void 0)},1005292:(o,d,f)=>{t.$b("HardSigmoid",o,{alpha:d,beta:f})},1005371:o=>{t.$b("Log",o,void 0)},1005422:o=>{t.$b("Sin",o,void 0)},1005473:o=>{t.$b("Cos",o,void 0)},1005524:o=>{t.$b("Tan",o,void 0)},1005575:o=>{t.$b("Asin",o,void 0)},1005627:o=>{t.$b("Acos",o,void 0)},1005679:o=>{t.$b("Atan",o,void 0)},1005731:o=>{t.$b("Sinh",o,void 0)},1005783:o=>{t.$b("Cosh",o,void 0)},1005835:o=>{t.$b("Asinh",o,void 0)},1005888:o=>{t.$b("Acosh",o,void 0)},1005941:o=>{t.$b("Atanh",o,void 0)},1005994:o=>{t.$b("Tanh",o,void 0)},1006046:o=>{t.$b("Not",o,void 0)},1006097:(o,d,f)=>{t.$b("Clip",o,{min:d,max:f})},1006166:o=>{t.$b("Clip",o,void 0)},1006218:(o,d)=>{t.$b("Elu",o,{alpha:d})},1006276:o=>{t.$b("Gelu",o,void 0)},1006328:o=>{t.$b("Relu",o,void 0)},1006380:(o,d)=>{t.$b("LeakyRelu",o,{alpha:d})},1006444:(o,d)=>{t.$b("ThresholdedRelu",o,{alpha:d})},1006514:(o,d)=>{t.$b("Cast",o,{to:d})},1006572:o=>{t.$b("Add",o,void 0)},1006623:o=>{t.$b("Sub",o,void 0)},1006674:o=>{t.$b("Mul",o,void 0)},1006725:o=>{t.$b("Div",o,void 0)},1006776:o=>{t.$b("Pow",o,void 0)},1006827:o=>{t.$b("Equal",o,void 0)},1006880:o=>{t.$b("Greater",o,void 0)},1006935:o=>{t.$b("GreaterOrEqual",o,void 0)},1006997:o=>{t.$b("Less",o,void 0)},1007049:o=>{t.$b("LessOrEqual",o,void 0)},1007108:(o,d,f,c,$)=>{t.$b("ReduceMean",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1007283:(o,d,f,c,$)=>{t.$b("ReduceMax",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1007457:(o,d,f,c,$)=>{t.$b("ReduceMin",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1007631:(o,d,f,c,$)=>{t.$b("ReduceProd",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1007806:(o,d,f,c,$)=>{t.$b("ReduceSum",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1007980:(o,d,f,c,$)=>{t.$b("ReduceL1",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1008153:(o,d,f,c,$)=>{t.$b("ReduceL2",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1008326:(o,d,f,c,$)=>{t.$b("ReduceLogSum",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1008503:(o,d,f,c,$)=>{t.$b("ReduceSumSquare",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1008683:(o,d,f,c,$)=>{t.$b("ReduceLogSumExp",o,{keepDims:!!d,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1008863:o=>{t.$b("Where",o,void 0)},1008916:(o,d,f)=>{t.$b("Transpose",o,{perm:d?Array.from((v(),A).subarray(Number(d)>>>0,Number(f)>>>0)):[]})},1009040:(o,d,f,c)=>{t.$b("DepthToSpace",o,{blocksize:d,mode:Te(f),format:c?"NHWC":"NCHW"})},1009173:(o,d,f,c)=>{t.$b("DepthToSpace",o,{blocksize:d,mode:Te(f),format:c?"NHWC":"NCHW"})},1009306:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e,pt)=>{t.$b("ConvTranspose",o,{format:q?"NHWC":"NCHW",autoPad:d,dilations:[f],group:c,kernelShape:[$],pads:[T,C],strides:[B],wIsConst:()=>!!(v(),X)[V>>>0],outputPadding:ne?Array.from((v(),A).subarray(Number(ne)>>>0,Number(pe)>>>0)):[],outputShape:ge?Array.from((v(),A).subarray(Number(ge)>>>0,Number(_e)>>>0)):[],activation:Te(pt)})},1009739:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((v(),A).subarray(Number(f)>>>0,(Number(f)>>>0)+2>>>0)),group:c,kernelShape:Array.from((v(),A).subarray(Number($)>>>0,(Number($)>>>0)+2>>>0)),pads:Array.from((v(),A).subarray(Number(T)>>>0,(Number(T)>>>0)+4>>>0)),strides:Array.from((v(),A).subarray(Number(C)>>>0,(Number(C)>>>0)+2>>>0)),wIsConst:()=>!!(v(),X)[q>>>0],outputPadding:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],outputShape:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[],activation:Te(_e)})},1010400:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e,pt)=>{t.$b("ConvTranspose",o,{format:q?"NHWC":"NCHW",autoPad:d,dilations:[f],group:c,kernelShape:[$],pads:[T,C],strides:[B],wIsConst:()=>!!(v(),X)[V>>>0],outputPadding:ne?Array.from((v(),A).subarray(Number(ne)>>>0,Number(pe)>>>0)):[],outputShape:ge?Array.from((v(),A).subarray(Number(ge)>>>0,Number(_e)>>>0)):[],activation:Te(pt)})},1010833:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((v(),A).subarray(Number(f)>>>0,(Number(f)>>>0)+2>>>0)),group:c,kernelShape:Array.from((v(),A).subarray(Number($)>>>0,(Number($)>>>0)+2>>>0)),pads:Array.from((v(),A).subarray(Number(T)>>>0,(Number(T)>>>0)+4>>>0)),strides:Array.from((v(),A).subarray(Number(C)>>>0,(Number(C)>>>0)+2>>>0)),wIsConst:()=>!!(v(),X)[q>>>0],outputPadding:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],outputShape:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[],activation:Te(_e)})},1011494:(o,d)=>{t.$b("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},1011585:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("AveragePool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:f,count_include_pad:c,storage_order:$,dilations:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((v(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],strides:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},1012064:(o,d)=>{t.$b("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},1012155:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("AveragePool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:f,count_include_pad:c,storage_order:$,dilations:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((v(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],strides:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},1012634:(o,d)=>{t.$b("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},1012721:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("MaxPool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:f,count_include_pad:c,storage_order:$,dilations:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((v(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],strides:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},1013196:(o,d)=>{t.$b("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},1013283:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e)=>{t.$b("MaxPool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:f,count_include_pad:c,storage_order:$,dilations:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((v(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],strides:pe?Array.from((v(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},1013758:(o,d,f,c,$)=>{t.$b("Gemm",o,{alpha:d,beta:f,transA:c,transB:$})},1013862:o=>{t.$b("MatMul",o,void 0)},1013916:(o,d,f,c)=>{t.$b("ArgMax",o,{keepDims:!!d,selectLastIndex:!!f,axis:c})},1014024:(o,d,f,c)=>{t.$b("ArgMin",o,{keepDims:!!d,selectLastIndex:!!f,axis:c})},1014132:(o,d)=>{t.$b("Softmax",o,{axis:d})},1014195:(o,d)=>{t.$b("Concat",o,{axis:d})},1014255:(o,d,f,c,$)=>{t.$b("Split",o,{axis:d,numOutputs:f,splitSizes:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1014411:o=>{t.$b("Expand",o,void 0)},1014465:(o,d)=>{t.$b("Gather",o,{axis:Number(d)})},1014536:(o,d)=>{t.$b("GatherElements",o,{axis:Number(d)})},1014615:(o,d)=>{t.$b("GatherND",o,{batch_dims:Number(d)})},1014694:(o,d,f,c,$,T,C,B,q,V,ne)=>{t.$b("Resize",o,{antialias:d,axes:f?Array.from((v(),A).subarray(Number(f)>>>0,Number(c)>>>0)):[],coordinateTransformMode:Te($),cubicCoeffA:T,excludeOutside:C,extrapolationValue:B,keepAspectRatioPolicy:Te(q),mode:Te(V),nearestMode:Te(ne)})},1015056:(o,d,f,c,$,T,C)=>{t.$b("Slice",o,{starts:d?Array.from((v(),A).subarray(Number(d)>>>0,Number(f)>>>0)):[],ends:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[],axes:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[]})},1015320:o=>{t.$b("Tile",o,void 0)},1015372:(o,d,f)=>{t.$b("InstanceNormalization",o,{epsilon:d,format:f?"NHWC":"NCHW"})},1015486:(o,d,f)=>{t.$b("InstanceNormalization",o,{epsilon:d,format:f?"NHWC":"NCHW"})},1015600:o=>{t.$b("Range",o,void 0)},1015653:(o,d)=>{t.$b("Einsum",o,{equation:Te(d)})},1015734:(o,d,f,c,$)=>{t.$b("Pad",o,{mode:d,value:f,pads:c?Array.from((v(),A).subarray(Number(c)>>>0,Number($)>>>0)):[]})},1015877:(o,d,f,c,$,T)=>{t.$b("BatchNormalization",o,{epsilon:d,momentum:f,spatial:!!$,trainingMode:!!c,format:T?"NHWC":"NCHW"})},1016046:(o,d,f,c,$,T)=>{t.$b("BatchNormalization",o,{epsilon:d,momentum:f,spatial:!!$,trainingMode:!!c,format:T?"NHWC":"NCHW"})},1016215:(o,d,f)=>{t.$b("CumSum",o,{exclusive:Number(d),reverse:Number(f)})},1016312:(o,d,f)=>{t.$b("DequantizeLinear",o,{axis:d,blockSize:f})},1016402:(o,d,f,c,$)=>{t.$b("GridSample",o,{align_corners:d,mode:Te(f),padding_mode:Te(c),format:$?"NHWC":"NCHW"})},1016572:(o,d,f,c,$)=>{t.$b("GridSample",o,{align_corners:d,mode:Te(f),padding_mode:Te(c),format:$?"NHWC":"NCHW"})},1016742:(o,d)=>{t.$b("ScatterND",o,{reduction:Te(d)})},1016827:(o,d,f,c,$,T,C,B,q)=>{t.$b("Attention",o,{numHeads:d,isUnidirectional:f,maskFilterValue:c,scale:$,doRotary:T,qkvHiddenSizes:C?Array.from((v(),A).subarray(Number(B)>>>0,Number(B)+C>>>0)):[],pastPresentShareBuffer:!!q})},1017099:o=>{t.$b("BiasAdd",o,void 0)},1017154:o=>{t.$b("BiasSplitGelu",o,void 0)},1017215:o=>{t.$b("FastGelu",o,void 0)},1017271:(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e,pt,yi)=>{t.$b("Conv",o,{format:pe?"NHWC":"NCHW",auto_pad:d,dilations:f?Array.from((v(),A).subarray(Number(f)>>>0,Number(c)>>>0)):[],group:$,kernel_shape:T?Array.from((v(),A).subarray(Number(T)>>>0,Number(C)>>>0)):[],pads:B?Array.from((v(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],strides:V?Array.from((v(),A).subarray(Number(V)>>>0,Number(ne)>>>0)):[],w_is_const:()=>!!(v(),X)[Number(ge)>>>0],activation:Te(_e),activation_params:pt?Array.from((v(),J).subarray(Number(pt)>>>0,Number(yi)>>>0)):[]})},1017855:o=>{t.$b("Gelu",o,void 0)},1017907:(o,d,f,c,$,T,C,B,q)=>{t.$b("GroupQueryAttention",o,{numHeads:d,kvNumHeads:f,scale:c,softcap:$,doRotary:T,rotaryInterleaved:C,smoothSoftmax:B,localWindowSize:q})},1018124:(o,d,f,c)=>{t.$b("LayerNormalization",o,{axis:d,epsilon:f,simplified:!!c})},1018235:(o,d,f,c)=>{t.$b("LayerNormalization",o,{axis:d,epsilon:f,simplified:!!c})},1018346:(o,d,f,c,$,T)=>{t.$b("MatMulNBits",o,{k:d,n:f,accuracyLevel:c,bits:$,blockSize:T})},1018473:(o,d,f,c,$,T)=>{t.$b("MultiHeadAttention",o,{numHeads:d,isUnidirectional:f,maskFilterValue:c,scale:$,doRotary:T})},1018632:(o,d)=>{t.$b("QuickGelu",o,{alpha:d})},1018696:(o,d,f,c,$)=>{t.$b("RotaryEmbedding",o,{interleaved:!!d,numHeads:f,rotaryEmbeddingDim:c,scale:$})},1018835:(o,d,f)=>{t.$b("SkipLayerNormalization",o,{epsilon:d,simplified:!!f})},1018937:(o,d,f)=>{t.$b("SkipLayerNormalization",o,{epsilon:d,simplified:!!f})},1019039:(o,d,f,c)=>{t.$b("GatherBlockQuantized",o,{gatherAxis:d,quantizeAxis:f,blockSize:c})},1019160:o=>{t.Fd(o)},1019194:(o,d)=>t.Hd(Number(o),Number(d),t.Yc.Kd,t.Yc.errors)};function Wm(o,d,f){return Pn(async()=>{await t.Dd(Number(o),Number(d),Number(f))})}function Vm(){return typeof wasmOffsetConverter<"u"}function Gm(o,d,f,c){var $=ue();try{return ws(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function Hm(o,d,f){var c=ue();try{return ys(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;le(1,0)}}function Fm(o){var d=ue();try{fs(o)}catch(f){if(oe(d),f!==f+0)throw f;le(1,0)}}function jm(o,d){var f=ue();try{return mi(o,d)}catch(c){if(oe(f),c!==c+0)throw c;le(1,0)}}function Km(o,d,f){var c=ue();try{hs(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;le(1,0)}}function Zm(o,d){var f=ue();try{vs(o,d)}catch(c){if(oe(f),c!==c+0)throw c;le(1,0)}}function Xm(o,d,f,c,$,T,C){var B=ue();try{return bs(o,d,f,c,$,T,C)}catch(q){if(oe(B),q!==q+0)throw q;le(1,0)}}function Qm(o,d,f,c,$,T){var C=ue();try{ms(o,d,f,c,$,T)}catch(B){if(oe(C),B!==B+0)throw B;le(1,0)}}function Ym(o,d,f,c){var $=ue();try{$s(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function Jm(o,d,f,c,$){var T=ue();try{gs(o,d,f,c,$)}catch(C){if(oe(T),C!==C+0)throw C;le(1,0)}}function eg(o,d,f,c,$,T,C){var B=ue();try{Ss(o,d,f,c,$,T,C)}catch(q){if(oe(B),q!==q+0)throw q;le(1,0)}}function tg(o,d,f,c,$,T,C){var B=ue();try{ks(o,d,f,c,$,T,C)}catch(q){if(oe(B),q!==q+0)throw q;le(1,0)}}function rg(o,d,f,c,$,T,C,B){var q=ue();try{zs(o,d,f,c,$,T,C,B)}catch(V){if(oe(q),V!==V+0)throw V;le(1,0)}}function ig(o,d,f,c,$){var T=ue();try{return xs(o,d,f,c,$)}catch(C){if(oe(T),C!==C+0)throw C;le(1,0)}}function ag(o,d,f){var c=ue();try{return Cs(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;le(1,0)}}function ng(o,d,f,c,$,T,C,B){var q=ue();try{As(o,d,f,c,$,T,C,B)}catch(V){if(oe(q),V!==V+0)throw V;le(1,0)}}function sg(o,d,f,c,$,T,C,B,q,V,ne,pe){var ge=ue();try{Ts(o,d,f,c,$,T,C,B,q,V,ne,pe)}catch(_e){if(oe(ge),_e!==_e+0)throw _e;le(1,0)}}function og(o,d,f,c,$,T){var C=ue();try{return Is(o,d,f,c,$,T)}catch(B){if(oe(C),B!==B+0)throw B;le(1,0)}}function ug(o,d,f){var c=ue();try{return Os(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;return le(1,0),0n}}function lg(o,d,f,c,$,T,C,B,q){var V=ue();try{_s(o,d,f,c,$,T,C,B,q)}catch(ne){if(oe(V),ne!==ne+0)throw ne;le(1,0)}}function dg(o){var d=ue();try{return Rs(o)}catch(f){if(oe(d),f!==f+0)throw f;le(1,0)}}function pg(o,d){var f=ue();try{return Ks(o,d)}catch(c){if(oe(f),c!==c+0)throw c;return le(1,0),0n}}function cg(o){var d=ue();try{return Bs(o)}catch(f){if(oe(d),f!==f+0)throw f;return le(1,0),0n}}function hg(o,d,f,c){var $=ue();try{return qs(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function fg(o,d,f,c,$){var T=ue();try{return Ls(o,d,f,c,$)}catch(C){if(oe(T),C!==C+0)throw C;le(1,0)}}function mg(o,d,f,c,$,T){var C=ue();try{return Ws(o,d,f,c,$,T)}catch(B){if(oe(C),B!==B+0)throw B;le(1,0)}}function gg(o,d,f,c,$,T){var C=ue();try{return Vs(o,d,f,c,$,T)}catch(B){if(oe(C),B!==B+0)throw B;le(1,0)}}function yg(o,d,f,c,$,T,C,B){var q=ue();try{return Es(o,d,f,c,$,T,C,B)}catch(V){if(oe(q),V!==V+0)throw V;le(1,0)}}function _g(o,d,f,c,$){var T=ue();try{return Gs(o,d,f,c,$)}catch(C){if(oe(T),C!==C+0)throw C;return le(1,0),0n}}function bg(o,d,f,c){var $=ue();try{return Hs(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function $g(o,d,f,c){var $=ue();try{return Fs(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function wg(o,d,f,c,$,T,C,B,q,V,ne,pe){var ge=ue();try{return js(o,d,f,c,$,T,C,B,q,V,ne,pe)}catch(_e){if(oe(ge),_e!==_e+0)throw _e;le(1,0)}}function vg(o,d,f,c,$,T,C,B,q,V,ne){var pe=ue();try{Us(o,d,f,c,$,T,C,B,q,V,ne)}catch(ge){if(oe(pe),ge!==ge+0)throw ge;le(1,0)}}function xg(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e,pt,yi){var Ig=ue();try{Ps(o,d,f,c,$,T,C,B,q,V,ne,pe,ge,_e,pt,yi)}catch(_i){if(oe(Ig),_i!==_i+0)throw _i;le(1,0)}}function Sg(o,d,f){var c=ue();try{return Ns(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;le(1,0)}}function kg(o,d,f){var c=ue();try{return Ms(o,d,f)}catch($){if(oe(c),$!==$+0)throw $;le(1,0)}}function Tg(o,d,f,c){var $=ue();try{Ds(o,d,f,c)}catch(T){if(oe($),T!==T+0)throw T;le(1,0)}}function kr(){if(0<Be)bt=kr;else if(a)w?.(t),G();else{for(var o=xe;0<o.length;)o.shift()(t);0<Be?bt=kr:(t.calledRun=!0,z||(G(),w?.(t)))}}return a||(rt=await ve(),kr()),t.PTR_SIZE=4,Y?t:new Promise((o,d)=>{w=o,S=d})}var rp,ro,Kg=U(()=>{"use strict";rp=to,ro=globalThis.self?.name?.startsWith("em-pthread"),ro&&to()}),Si,ma,io,Ne,ip,Ir,ao,no,ki,so,Ti,ap,Ii,np,Na=U(()=>{"use strict";Ba(),Si=typeof location>"u"?void 0:location.origin,ma=import.meta.url>"file:"&&import.meta.url<"file;",io=()=>{if(ma){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,Si).href}return import.meta.url},Ne=io(),ip=()=>{if(Ne&&!Ne.startsWith("blob:"))return Ne.substring(0,Ne.lastIndexOf("/")+1)},Ir=(e,t)=>{try{let r=t??Ne;return(r?new URL(e,r):new URL(e)).origin===Si}catch{return!1}},ao=(e,t)=>{let r=t??Ne;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},no=(e,t)=>`${t??"./"}${e}`,ki=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},so=async e=>(await import(e)).default,Ti=(jg(),dr(Jd)).default,ap=async()=>{if(!Ne)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Ir(Ne))return[void 0,Ti()];let e=await ki(Ne);return[e,Ti(e)]},Ii=(Kg(),dr(tp)).default,np=async(e,t,r,i)=>{let a=Ii&&!(e||t);if(a)if(Ne)a=Ir(Ne)||i&&!r;else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,Ii];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??ao(n,t),u=r&&s&&!Ir(s,t),l=u?await ki(s):s??no(n,t);return[u?l:void 0,await so(l)]}}}),Ei,Er,Xt,zi,oo,uo,lo,Ma,ye,Mt=U(()=>{"use strict";Na(),Er=!1,Xt=!1,zi=!1,oo=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},uo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},lo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Ma=async e=>{if(Er)return Promise.resolve();if(Xt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(zi)throw new Error("previous call to 'initializeWebAssembly()' failed.");Xt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!lo())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!uo())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=oo();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a?.mjs,u=s?.href??s,l=a?.wasm,p=l?.href??l,m=e.wasmBinary,[h,g]=await np(u,n,r>1,!!m||!!p),_=!1,y=[];if(t>0&&y.push(new Promise(w=>{setTimeout(()=>{_=!0,w()},t)})),y.push(new Promise((w,S)=>{let x={numThreads:r};if(m)x.wasmBinary=m,x.locateFile=b=>b;else if(p||n)x.locateFile=b=>p??n+b;else if(u&&u.indexOf("blob:")!==0)x.locateFile=b=>new URL(b,u).href;else if(h){let b=ip();b&&(x.locateFile=I=>b+I)}g(x).then(b=>{Xt=!1,Er=!0,Ei=b,w(),h&&URL.revokeObjectURL(h)},b=>{Xt=!1,zi=!0,S(b)})})),await Promise.race(y),_)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ye=()=>{if(Er&&Ei)return Ei;throw new Error("WebAssembly is not initialized yet.")}}),Ke,Lr,fe,Da=U(()=>{"use strict";Mt(),Ke=(e,t)=>{let r=ye(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},Lr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")Lr(n,s+".",r,i);else if(typeof n=="string"||typeof n=="number")i(s,n.toString());else if(typeof n=="boolean")i(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},fe=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let n=Number(t.getValue(a,i===4?"i32":"i64")),s=t.getValue(a+i,"*"),u=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${u}`)}finally{t.stackRestore(r)}}}),sp,Zg=U(()=>{"use strict";Mt(),Da(),sp=e=>{let t=ye(),r=0,i=[],a=e||{};try{if(e?.logSeverityLevel===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(a.terminate=!1);let n=0;return e?.tag!==void 0&&(n=Ke(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),r===0&&fe("Can't create run options."),e?.extra!==void 0&&Lr(e.extra,"",new WeakSet,(s,u)=>{let l=Ke(s,i),p=Ke(u,i);t._OrtAddRunConfigEntry(r,l,p)!==0&&fe(`Can't set a run config entry: ${s} - ${u}.`)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),n}}}),po,co,ho,St,fo,op,Xg=U(()=>{"use strict";Mt(),Da(),po=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},co=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},ho=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},St=(e,t,r,i)=>{let a=Ke(t,i),n=Ke(r,i);ye()._OrtAddSessionConfigEntry(e,a,n)!==0&&fe(`Can't set a session config entry: ${t} - ${r}.`)},fo=async(e,t,r)=>{let i=t.executionProviders;for(let a of i){let n=typeof a=="string"?a:a.name,s=[];switch(n){case"webnn":if(n="WEBNN",St(e,"session.disable_quant_qdq","1",r),St(e,"session.disable_qdq_constant_folding","1",r),typeof a!="string"){let h=a?.deviceType;h&&St(e,"deviceType",h,r)}break;case"webgpu":if(n="JS",typeof a!="string"){let h=a;if(h?.preferredLayout){if(h.preferredLayout!=="NCHW"&&h.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${h.preferredLayout}`);St(e,"preferredLayout",h.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${n}`)}let u=Ke(n,r),l=s.length,p=0,m=0;if(l>0){p=ye()._malloc(l*ye().PTR_SIZE),r.push(p),m=ye()._malloc(l*ye().PTR_SIZE),r.push(m);for(let h=0;h<l;h++)ye().setValue(p+h*ye().PTR_SIZE,s[h][0],"*"),ye().setValue(m+h*ye().PTR_SIZE,s[h][1],"*")}await ye()._OrtAppendExecutionProvider(e,u,p,m,l)!==0&&fe(`Can't append execution provider: ${n}.`)}},op=async e=>{let t=ye(),r=0,i=[],a=e||{};ho(a);try{let n=po(a.graphOptimizationLevel??"all"),s=co(a.executionMode??"sequential"),u=typeof a.logId=="string"?Ke(a.logId,i):0,l=a.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let p=a.logVerbosityLevel??0;if(!Number.isInteger(p)||p<0||p>4)throw new Error(`log verbosity level is not valid: ${p}`);let m=typeof a.optimizedModelFilePath=="string"?Ke(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,u,l,p,m),r===0&&fe("Can't create session options."),a.executionProviders&&await fo(r,a,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);St(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[h,g]of Object.entries(a.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof g!="number"||!Number.isInteger(g)||g<0)throw new Error(`free dimension override value must be a non-negative integer: ${g}`);let _=Ke(h,i);t._OrtAddFreeDimensionOverride(r,_,g)!==0&&fe(`Can't set a free dimension override: ${h} - ${g}.`)}return a.extra!==void 0&&Lr(a.extra,"",new WeakSet,(h,g)=>{St(r,h,g,i)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&fe("Can't release session options."),i.forEach(s=>t._free(s)),n}}}),Ct,at,At,Kr,Wr,Ua,Pa,ga,ee=U(()=>{"use strict";Ct=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},at=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},At=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return r>0?Math.ceil(i*r):void 0},Kr=e=>{switch(e){case"float16":return typeof Float16Array<"u"?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Wr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Ua=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Pa=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ga=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),qa,up=U(()=>{"use strict";Ba(),qa=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(i)}catch(u){if(u instanceof RangeError){let l=Math.ceil(i/65536);n=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw u}let s=0;for(;;){let{done:u,value:l}=await a.read();if(u)break;let p=l.byteLength;new Uint8Array(n,s,p).set(l),s+=p}return new Uint8Array(n,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),mo,go,yo,_o,La,bo,de,nt=U(()=>{"use strict";ee(),mo=["V","I","W","E","F"],go=(e,t)=>{console.log(`[${mo[e]},${new Date().toISOString()}]${t}`)},La=(e,t)=>{yo=e,_o=t},bo=(e,t)=>{let r=Wr(e),i=Wr(yo);r>=i&&go(r,typeof t=="function"?t():t)},de=(...e)=>{_o&&bo(...e)}}),$o,Wt,R,Vr,lp,dp,pp,re=U(()=>{"use strict";$o=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Wt=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(r){if(i<2||a<2)return;let u=$o.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(u===void 0)return;[s[n-2],s[n-1]]=u}for(let u=r?3:1;u<=n;u++){let l=i-u<0?1:e[i-u],p=a-u<0?1:t[a-u];if(l!==p&&l>1&&p>1)return;let m=Math.max(l,p);if(l&&p)s[n-u]=Math.max(l,p);else{if(m>1)return;s[n-u]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},R=class Pr{static size(t){return Pr.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),n=i-1;for(;n>=0;){if(t[n]%r===0){a[n]=t[n]/r;break}if(r%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,r/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Pr.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Pr.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let n=r;n<i;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,n)=>a+r[n]+r[n+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},Vr=class sr{static adjustPoolAttributes(t,r,i,a,n,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let u=0;u<r.length-2;u++)u>=i.length?i.push(r[u+2]):i[u]=r[u+2];for(let u=0;u<i.length;u++)if(u<a.length){if(a[u]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let u=0;u<i.length;u++)if(u<n.length){if(n[u]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let u=0;u<i.length*2;u++)if(u<s.length){if(s[u]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let u=0;u<i.length;u++){if(i[u]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[u]>=i[u]||s[u+i.length]>=i[u])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,n,s,u){if(u){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)sr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],a[l],n,l,l+t.length-2,u)}}static computePoolOutputShape(t,r,i,a,n,s,u){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return sr.computeShapeHelper(t,r,l,i,a,n,s,u),l}static computeConvOutputShape(t,r,i,a,n,s,u){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return sr.computeShapeHelper(!1,t,l,i,a,n,s,u),l}static computeShapeHelper(t,r,i,a,n,s,u,l){if(t)for(let p=0;p<r.length-2;p++)i.push(1);else for(let p=0;p<r.length-2;p++)i.push(sr.adjustPadAndReturnShape(r[p+2],a[p],n[p],s[p],u,p,p+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,a,n,s,u,l){let p=i*(a-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return n[s]=0,n[u]=0,Math.floor((t-p)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let m=((t+r-1)/r-1)*r+a-t;return n[s]=Math.floor(l==="SAME_LOWER"?(m+1)/2:m/2),n[u]=m-n[s],Math.floor((t+m-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[u]-p)/r+1)}},lp=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let n,s,u;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let l=-1;if(i?(u=r[0],l=1):(u=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(n<=0||u<=0||s<=0)throw new Error("invalid shape specified");if(a&&!Wt.isValidBroadcast(a,[n,u]))throw new Error("gemm: invalid bias shape for broadcast");return[n,u,s]}},dp=-34028234663852886e22,pp=34028234663852886e22}),Wa,cp=U(()=>{"use strict";ee(),Wa=(e,t)=>new(Kr(t))(e)}),Ci,ya,Ai,wo,Oi,vo,Ri,Bi,Ni,xo,hp,Qg=U(()=>{"use strict";ee(),nt(),Ci=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ya=(e,t)=>{if(t==="int32")return e;let r=Ci.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,n=new(Kr(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let u=0;u<a;u++){let l=n[u];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[u]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(u=>u>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Ai=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},wo=1,Oi=()=>wo++,vo=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Ri=(e,t)=>{let r=Ci.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},Bi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Ri(this.dataType,this.tensorShape)}destroy(){de("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Ai(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return new Uint8Array(r).buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},Ni=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),n=this.tensorManager.getMLOpSupportLimits(e),s;if(!n?.input.dataTypes.includes(t)){if(s=vo.get(t),!s||n?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);de("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==Ri(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let u=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,u,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ya(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else de("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?Ai(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},xo=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=Oi();return this.tensorTrackersById.set(e,new Ni(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){de("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){de("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),n=Oi(),s=new Bi({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(n,new Ni(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,r,i,a,n,s){let u=this.getMLContext(e);for(let[p,m]of this.freeTensors.entries())if(m.canReuseTensor(u,t,r)){de("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(p,1)[0];return h.sessionId=e,h}de("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await u.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:a,readable:n});return new Bi({sessionId:e,context:u,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},hp=(...e)=>new xo(...e)}),Qt,So,fp,Yg=U(()=>{"use strict";ee(),Mt(),cp(),Qg(),nt(),Qt=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),So=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,n)=>a===i[n]&&e[a]===t[a])},fp=class{constructor(e){this.tensorManager=hp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,La(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){de("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){de("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)de("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>So(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){de("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let n=Qt.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,i,a)}async createTemporaryTensor(e,t,r){de("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=Qt.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!ye().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");de("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Wa(r,t)}}registerMLTensor(e,t,r,i){let a=Qt.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let n=this.tensorManager.registerTensor(e,t,a,i);return de("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,r,i,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let u=e;e.startsWith("./")&&(u=e.substring(2));let l=n.get(u);if(!l)throw new Error(`File with name ${u} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let p=l.slice(t,t+r).buffer,m;switch(a.dataType){case"float32":m=new Float32Array(p);break;case"float16":m=typeof Float16Array<"u"?new Float16Array(p):new Uint16Array(p);break;case"int32":m=new Int32Array(p);break;case"uint32":m=new Uint32Array(p);break;case"int64":if(s){let h=ya(new Uint8Array(p),"int64");m=new Int32Array(h.buffer),a.dataType="int32"}else m=new BigInt64Array(p);break;case"uint64":m=new BigUint64Array(p);break;case"int8":m=new Int8Array(p);break;case"int4":case"uint4":case"uint8":m=new Uint8Array(p);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return de("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,m)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=Qt.get(Ct(t)),a=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!a?.input.dataTypes.includes(i):!!a?.output.dataTypes.includes(i)}flush(){}}}),Va=U(()=>{"use strict"}),Mi,zr,Cr,ko,To,Di,_a,Io,mp,Jg=U(()=>{"use strict";nt(),Va(),Mi=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),zr=[],Cr=e=>Math.ceil(Number(e)/16)*16,ko=e=>{for(let t=0;t<zr.length;t++){let r=zr[t];if(e<=r)return r}return Math.ceil(e/16)*16},To=1,Di=()=>To++,_a=async(e,t,r,i)=>{let a=Cr(r),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let u=n.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(u,0,r)),l}else return new Uint8Array(u.slice(0,r))}finally{n.destroy()}},Io=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Mi)zr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,n=Cr(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=u.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,a)),u.unmap();let p=this.backend.device.createCommandEncoder();p.copyBufferToBuffer(u,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([p.finish()]),u.destroy(),de("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Cr(r.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return de("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=Di();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),de("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),de("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=ko(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let u=(a?this.freeBuffers:this.freeUniformBuffers).get(r);u?u.length>0?i=u.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:Di(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),de("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return de("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await _a(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Mi.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(de("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},mp=(...e)=>new Io(...e)}),Eo,he,ke=U(()=>{"use strict";Eo=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},he=e=>new Eo(e)}),Vt,Ar,Ie,Oe,Z,Se,ba,Lt,yt,j,Yt,N,H,gp,Ga,zo,yp,ie=U(()=>{"use strict";ee(),re(),Vt=64,Ar=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Ie=(e,t=1)=>{let r=Ar(e,t);return typeof r=="string"?r:r[0]},Oe=(e,t=1)=>{let r=Ar(e,t);return typeof r=="string"?r:r[1]},Z=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:R.computeStrides(r)})}),t},Se=e=>e%4===0?4:e%2===0?2:1,ba=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Lt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,yt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,j=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,Yt=(e,t,r,i,a)=>{let n=typeof r=="number",s=n?r:r.length,u=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,p=Ar(t,a),m=typeof p=="string"?p:p[1],h=typeof p=="string"?p:p[0],g={indices:l,value:m,storage:h,tensor:t},_=M=>typeof M=="string"?M:`${M}u`,y={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},w=n?"uniforms.":"",S=`${w}${e}_shape`,x=`${w}${e}_strides`,b="";for(let M=0;M<s-1;M++)b+=`
    let dim${M} = current / ${j(x,M,s)};
    let rest${M} = current % ${j(x,M,s)};
    indices[${M}] = dim${M};
    current = rest${M};
    `;b+=`indices[${s-1}] = current;`;let I=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${g.indices} {
    var indices: ${g.indices};
    var current = offset;
    ${b}
    return indices;
  }`,k=M=>(y.offsetToIndices=!0,s<2?M:`o2i_${e}(${M})`),E=[];if(s>=2)for(let M=s-1;M>=0;M--)E.push(`${j(x,M,s)} * (indices[${M}])`);let z=s<2?"":`
  fn i2o_${e}(indices: ${g.indices}) -> u32 {
    return ${E.join("+")};
  }`,O=M=>(y.indicesToOffset=!0,s<2?M:`i2o_${e}(${M})`),v=(...M)=>s===0?"0u":`${g.indices}(${M.map(_).join(",")})`,D=(M,Y)=>s<2?`${M}`:`${j(M,Y,s)}`,L=(M,Y,K)=>s<2?`${M}=${K};`:`${j(M,Y,s)}=${K};`,X={},W=(M,Y)=>{y.broadcastedIndicesToOffset=!0;let K=`${Y.name}broadcastedIndicesTo${e}Offset`;if(K in X)return`${K}(${M})`;let G=[];for(let $e=s-1;$e>=0;$e--){let Ae=Y.indicesGet("outputIndices",$e+Y.rank-s);G.push(`${D(x,$e)} * (${Ae} % ${D(S,$e)})`)}return X[K]=`fn ${K}(outputIndices: ${Y.type.indices}) -> u32 {
             return ${G.length>0?G.join("+"):"0u"};
           }`,`${K}(${M})`},F=(M,Y)=>(()=>{if(g.storage===g.value)return`${e}[${M}]=${Y};`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`${e}[${M}]=vec2<u32>(u32(${Y}), select(0u, 0xFFFFFFFFu, ${Y} < 0));`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`${e}[${M}]=vec2<u32>(u32(${Y}), 0u);`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`${e}[${M}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${Y}));`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),se=M=>(()=>{if(g.storage===g.value)return`${e}[${M}]`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`i32(${e}[${M}].x)`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`u32(${e}[${M}].x)`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${M}] & 0xFFu), bool(${e}[${M}] & 0xFF00u), bool(${e}[${M}] & 0xFF0000u), bool(${e}[${M}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),A=s<2?"":`
  fn get_${e}ByIndices(indices: ${g.indices}) -> ${m} {
    return ${se(`i2o_${e}(indices)`)};
  }`,P=s<2?"":(()=>{let M=u.map(K=>`d${K}: u32`).join(", "),Y=u.map(K=>`d${K}`).join(", ");return`
  fn get_${e}(${M}) -> ${m} {
    return get_${e}ByIndices(${v(Y)});
  }`})(),J=(...M)=>{if(M.length!==s)throw new Error(`indices length must be ${s}`);let Y=M.map(_).join(",");return s===0?se("0u"):s===1?se(Y[0]):(y.get=!0,y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}(${Y})`)},te=M=>s<2?se(M):(y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}ByIndices(${M})`),Q=s<2?"":`
  fn set_${e}ByIndices(indices: ${g.indices}, value: ${m}) {
    ${F(`i2o_${e}(indices)`,"value")}
  }`,ae=s<2?"":(()=>{let M=u.map(K=>`d${K}: u32`).join(", "),Y=u.map(K=>`d${K}`).join(", ");return`
  fn set_${e}(${M}, value: ${m}) {
    set_${e}ByIndices(${v(Y)}, value);
  }`})();return{impl:()=>{let M=[],Y=!1;return y.offsetToIndices&&(M.push(I),Y=!0),y.indicesToOffset&&(M.push(z),Y=!0),y.broadcastedIndicesToOffset&&(Object.values(X).forEach(K=>M.push(K)),Y=!0),y.set&&(M.push(ae),Y=!0),y.setByIndices&&(M.push(Q),Y=!0),y.get&&(M.push(P),Y=!0),y.getByIndices&&(M.push(A),Y=!0),!n&&Y&&M.unshift(`const ${S} = ${g.indices}(${r.join(",")});`,`const ${x} = ${g.indices}(${R.computeStrides(r).join(",")});`),M.join(`
`)},type:g,offsetToIndices:k,indicesToOffset:O,broadcastedIndicesToOffset:W,indices:v,indicesGet:D,indicesSet:L,set:(...M)=>{if(M.length!==s+1)throw new Error(`indices length must be ${s}`);let Y=M[s];if(typeof Y!="string")throw new Error("value must be string");let K=M.slice(0,s).map(_).join(",");return s===0?F("0u",Y):s===1?F(K[0],Y):(y.set=!0,y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}(${K}, ${Y})`)},setByOffset:F,setByIndices:(M,Y)=>s<2?F(M,Y):(y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}ByIndices(${M}, ${Y});`),get:J,getByOffset:se,getByIndices:te,usage:i,name:e,strides:x,shape:S,rank:s}},N=(e,t,r,i=1)=>Yt(e,t,r,"input",i),H=(e,t,r,i=1)=>Yt(e,t,r,"output",i),gp=(e,t,r)=>Yt(e,t,r,"atomicOutput",1),Ga=(e,t,r,i=1)=>Yt(e,t,r,"internal",i),zo=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=Vt){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${n}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},yp=(e,t)=>new zo(e,t)}),Co,Ui,Ao,Oo,Ro,Bo,De,_p,bp,_t=U(()=>{"use strict";ee(),re(),ke(),ie(),Co=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Ui=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Ao=(e,t)=>R.sortBasedOnPerm(e,Ui(e.length,t)),Oo=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},Ro=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},Bo=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},De=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Ui(i,t),n=Ao(e.dims,a),s=e.dims,u=n,l=i<2||Bo(a,e.dims),p;if(l)return p=y=>{let w=N("input",r,s,4),S=H("output",r,u,4);return`
  ${y.registerUniform("output_size","u32").declareVariables(w,S)}
  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let y=R.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(y/64/4)},programUniforms:[{type:12,data:Math.ceil(y/4)}]}},getShaderSource:p};let{newShape:m,newPerm:h}=Ro(e.dims,a),g=R.areEqual(h,[2,3,1]),_=R.areEqual(h,[3,1,2]);if(m.length===2||g||_){s=g?[m[0],m[1]*m[2]]:_?[m[0]*m[1],m[2]]:m,u=[s[1],s[0]];let y=16;return p=w=>{let S=N("a",r,s.length),x=H("output",r,u.length);return`
  ${w.registerUniform("output_size","u32").declareVariables(S,x)}
  var<workgroup> tile : array<array<${x.type.value}, ${y+1}>, ${y}>;
  ${w.mainStart([y,y,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${y} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${y}u + local_id.x;
    let input_row = workgroup_id_x * ${y}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${S.getByIndices(`${S.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${y}u + local_id.x;
    let output_row = workgroup_id_y * ${y}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${x.setByIndices(`${x.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let w=R.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(u[1]/y),y:Math.ceil(u[0]/y)},programUniforms:[{type:12,data:w},...Z(s,u)]}},getShaderSource:p}}return p=y=>{let w=N("a",r,s.length),S=H("output",r,u.length);return`
  ${y.registerUniform("output_size","u32").declareVariables(w,S)}

  ${Oo(a,i,w,S)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${S.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${S.setByOffset("global_idx",w.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let y=R.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:[{type:12,data:y},...Z(s,u)]}},getShaderSource:p}},_p=(e,t)=>{Co(e.inputs,t.perm),e.compute(De(e.inputs[0],t.perm))},bp=e=>he({perm:e.perm})}),No,Mo,Do,Uo,Po,qo,Lo,Wo,Vo,Go,Ve,$p,wp,vp,xp,Sp,kp,Tp,Ip,Ep,zp,e0=U(()=>{"use strict";ee(),re(),ie(),Ha(),_t(),No={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Mo={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Do={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Uo={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Po=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},qo=(e,t)=>{let r=[],i=e.length;for(let n=0;n<i;n++)t.indexOf(n)===-1&&r.push(e[n]);let a=t.map(n=>e[n]);return[r,a]},Lo=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let n=0;n<r;n++)t.indexOf(n)===-1?i.push(e[a++]):i.push(1);return i},Wo=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Vo=(e,t)=>{let r=[];if(!Wo(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},Go=(e,t,r,i,a,n,s)=>{let u=r[0].dims,l=R.size(n),p=R.size(s),m=N("_A",r[0].dataType,u),h=H("output",a,n),g=64;l===1&&(g=256);let _=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,y=w=>`
        ${w.registerUniform("reduceSize","u32").declareVariables(m,h)}
        ${_}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${w.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Do[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${m.getByOffset("offset + k")});
           bestValue = ${No[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Mo[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${i==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${Uo[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${g}`,inputDependencies:["type"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:l},programUniforms:[{type:12,data:p}]})}},Ve=(e,t,r,i)=>{let a=e.inputs.length===1?r:$a(e.inputs,r),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((_,y)=>y));let s=R.normalizeAxes(n,e.inputs[0].dims.length),u=s,l=e.inputs[0],p=Vo(u,e.inputs[0].dims.length);p.length>0&&(l=e.compute(De(e.inputs[0],p),{inputs:[0],outputs:[-1]})[0],u=Po(u.length,l.dims.length));let[m,h]=qo(l.dims,u),g=m;a.keepDims&&(g=Lo(m,s)),e.compute(Go(t,a.cacheKey,[l],i,e.inputs[0].dataType,g,h),{inputs:[l]})},$p=(e,t)=>{Ve(e,"ReduceMeanShared",t,"mean")},wp=(e,t)=>{Ve(e,"ReduceL1Shared",t,"l1")},vp=(e,t)=>{Ve(e,"ReduceL2Shared",t,"l2")},xp=(e,t)=>{Ve(e,"ReduceLogSumExpShared",t,"logSumExp")},Sp=(e,t)=>{Ve(e,"ReduceMaxShared",t,"max")},kp=(e,t)=>{Ve(e,"ReduceMinShared",t,"min")},Tp=(e,t)=>{Ve(e,"ReduceProdShared",t,"prod")},Ip=(e,t)=>{Ve(e,"ReduceSumShared",t,"sum")},Ep=(e,t)=>{Ve(e,"ReduceSumSquareShared",t,"sumSquare")},zp=(e,t)=>{Ve(e,"ReduceLogSumShared",t,"logSum")}}),Ge,Ho,Gr,$a,He,Fo,jo,Ko,Zo,Xo,Qo,Yo,Jo,eu,tu,Fe,Cp,Ap,Op,Rp,Bp,Np,Mp,Dp,Up,Pp,Ha=U(()=>{"use strict";ee(),re(),ke(),ie(),e0(),Ge=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Ho=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Gr=(e,t,r,i,a,n,s=!1,u=!1)=>{let l=[],p=r[0].dims,m=p.length,h=R.normalizeAxes(a,m),g=!u&&h.length===0;p.forEach((w,S)=>{g||h.indexOf(S)>=0?s&&l.push(1):l.push(w)});let _=l.length,y=R.size(l);return{name:e,shaderCache:t,getShaderSource:w=>{let S=[],x=N("_A",r[0].dataType,m),b=H("output",n,_),I=i(x,b,h),k=I[2];for(let E=0,z=0;E<m;E++)g||h.indexOf(E)>=0?(s&&z++,k=`for(var j${E}: u32 = 0; j${E} < ${p[E]}; j${E}++) {
                  ${I[2].includes("last_index")?`let last_index = j${E};`:""}
                  ${x.indicesSet("input_indices",E,`j${E}`)}
                  ${k}
                }`):(S.push(`${x.indicesSet("input_indices",E,b.indicesGet("output_indices",z))};`),z++);return`

        ${w.registerUniform("output_size","u32").declareVariables(x,b)}

        ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${x.type.indices};
          let output_indices = ${b.offsetToIndices("global_idx")};

          ${S.join(`
`)}
          ${I[0]}       // init ops for reduce max/min
          ${I[1]}
          ${k}
          ${I[3]}
          ${I.length===4?b.setByOffset("global_idx","value"):I.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:l,dataType:n}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:[{type:12,data:y},...Z(p,l)]})}},$a=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),he({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},He=(e,t,r,i)=>{let a=e.inputs,n=a.length===1?r:$a(a,r);e.compute(Gr(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?Ho:i,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},Fo=(e,t)=>{Ge(e.inputs),He(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},jo=(e,t)=>{Ge(e.inputs),He(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Ko=(e,t)=>{Ge(e.inputs),He(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Zo=(e,t)=>{Ge(e.inputs),He(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Xo=(e,t)=>{Ge(e.inputs),He(e,"ReduceMax",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(r.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Qo=(e,t)=>{Ge(e.inputs),He(e,"ReduceMean",t,(r,i,a)=>{let n=1;for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${n});`]})},Yo=(e,t)=>{Ge(e.inputs),He(e,"ReduceMin",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Jo=(e,t)=>{Ge(e.inputs),He(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},eu=(e,t)=>{Ge(e.inputs),He(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},tu=(e,t)=>{Ge(e.inputs),He(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Fe=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?i*=e[n]:a*=e[n];return a<32&&i>1024},Cp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Qo(e,t):$p(e,t)},Ap=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?jo(e,t):wp(e,t)},Op=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ko(e,t):vp(e,t)},Rp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Zo(e,t):xp(e,t)},Bp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Xo(e,t):Sp(e,t)},Np=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Yo(e,t):kp(e,t)},Mp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Jo(e,t):Tp(e,t)},Dp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?eu(e,t):Ip(e,t)},Up=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?tu(e,t):Ep(e,t)},Pp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Fo(e,t):zp(e,t)}}),Pi,qp,Lp,wa,t0=U(()=>{"use strict";ee(),ke(),Ha(),Pi=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},qp=(e,t)=>{Pi(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Gr("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Lp=(e,t)=>{Pi(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Gr("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},wa=e=>he(e)}),ru,Or,iu,au,nu,cr,su,Wp,Fa=U(()=>{"use strict";ee(),re(),Va(),ie(),ru=(e,t)=>{let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4],u=e[5];if(s&&u)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],p=r.dims[1],m=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==m)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=a.dims[0]/3,g=h,_=g;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let I of t.qkvHiddenSizes)if(I%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],g=t.qkvHiddenSizes[1],_=t.qkvHiddenSizes[2]}let y=p;if(h!==g)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==h+g+_)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let w=0;if(s){if(g!==_)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==g/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(w=s.dims[3])}let S=y+w,x=-1,b=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(u){if(u.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(u.dims[0]!==l||u.dims[1]!==t.numHeads||u.dims[2]!==p||u.dims[3]!==S)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:p,pastSequenceLength:w,kvSequenceLength:y,totalSequenceLength:S,maxSequenceLength:x,inputHiddenSize:m,hiddenSize:h,vHiddenSize:_,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(_/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Or=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,iu=(e,t,r,i,a,n,s,u)=>{let l=Se(s?1:n),p=64,m=n/l;m<p&&(p=32);let h=Math.ceil(n/l/p),g=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:m},{type:12,data:h}],_=Ie(e.dataType,l),y=Oe(1,l),w=["type"];s&&w.push("type"),u&&w.push("type");let S=x=>{let b=H("x",e.dataType,e.dims,l),I=[b],k=s?N("seq_lens",s.dataType,s.dims):void 0;k&&I.push(k);let E=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;E&&I.push(E);let z=Oe(e.dataType),O=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${p}>;
  var<workgroup> thread_sum: array<f32, ${p}>;
  ${x.registerUniforms(O).declareVariables(...I)}
  ${x.mainStart([p,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Or(k,E,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${p}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${y}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${y}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(l){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${p}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${y}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${y}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(l){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${p}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${b.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${y}(x[offset + i]);
        x[offset + i] = ${b.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${b.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${p};${_};${l}`,inputDependencies:w},getShaderSource:S,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:g})}},au=(e,t,r,i,a,n,s,u,l)=>{let p=s+n.kvSequenceLength,m=[n.batchSize,n.numHeads,n.sequenceLength,p],h=e>1&&i,g=n.kvNumHeads?n.kvNumHeads:n.numHeads,_=h?[n.batchSize,g,p,n.headSize]:void 0,y=n.nReps?n.nReps:1,w=n.scale===0?1/Math.sqrt(n.headSize):n.scale,S=Se(n.headSize),x=n.headSize/S,b=12,I={x:Math.ceil(p/b),y:Math.ceil(n.sequenceLength/b),z:n.batchSize*n.numHeads},k=[{type:12,data:n.sequenceLength},{type:12,data:x},{type:12,data:p},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:w},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:y}],E=h&&i&&R.size(i.dims)>0,z=["type","type"];E&&z.push("type"),a&&z.push("type"),u&&z.push("type"),l&&z.push("type");let O=[{dims:m,dataType:t.dataType,gpuDataType:0}];h&&O.push({dims:_,dataType:t.dataType,gpuDataType:0});let v=D=>{let L=N("q",t.dataType,t.dims,S),X=N("key",r.dataType,r.dims,S),W=[L,X];if(E){let Q=N("past_key",i.dataType,i.dims,S);W.push(Q)}a&&W.push(N("attention_bias",a.dataType,a.dims));let F=u?N("seq_lens",u.dataType,u.dims):void 0;F&&W.push(F);let se=l?N("total_sequence_length_input",l.dataType,l.dims):void 0;se&&W.push(se);let A=H("output",t.dataType,m),P=[A];h&&P.push(H("present_key",t.dataType,_,S));let J=Oe(1,S),te=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;

  var<workgroup> tileQ: array<${L.type.storage}, ${b*b}>;
  var<workgroup> tileK: array<${L.type.storage}, ${b*b}>;
  ${D.registerUniforms(te).declareVariables(...W,...P)}
  ${D.mainStart([b,b,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${y===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${y===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Or(F,se,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${E&&h?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${h?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${J}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${E&&h?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${h?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${J}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(S){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${S}`)}})()};
        output[outputIdx] = ${A.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${S};${a!==void 0};${i!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:O,dispatchGroup:I,programUniforms:k}),getShaderSource:v}},nu=(e,t,r,i,a,n,s=void 0,u=void 0)=>{let l=n+a.kvSequenceLength,p=a.nReps?a.nReps:1,m=a.vHiddenSize*p,h=e>1&&i,g=a.kvNumHeads?a.kvNumHeads:a.numHeads,_=h?[a.batchSize,g,l,a.headSize]:void 0,y=[a.batchSize,a.sequenceLength,m],w=12,S={x:Math.ceil(a.vHeadSize/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:l},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:m},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:p}],b=h&&i&&R.size(i.dims)>0,I=["type","type"];b&&I.push("type"),s&&I.push("type"),u&&I.push("type");let k=[{dims:y,dataType:t.dataType,gpuDataType:0}];h&&k.push({dims:_,dataType:t.dataType,gpuDataType:0});let E=z=>{let O=N("probs",t.dataType,t.dims),v=N("v",r.dataType,r.dims),D=[O,v];b&&D.push(N("past_value",i.dataType,i.dims));let L=s?N("seq_lens",s.dataType,s.dims):void 0;s&&D.push(L);let X=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;u&&D.push(X);let W=[H("output",t.dataType,y)];h&&W.push(H("present_value",t.dataType,_));let F=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;
  var<workgroup> tileQ: array<${O.type.value}, ${w*w}>;
  var<workgroup> tileV: array<${O.type.value}, ${w*w}>;
  ${z.registerUniforms(F).declareVariables(...D,...W)}
  ${z.mainStart([w,w,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${p===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${p===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Or(L,X,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${b&&h?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${h?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${O.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${b&&h?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${h?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:I},getRunData:()=>({outputs:k,dispatchGroup:S,programUniforms:x}),getShaderSource:E}},cr=(e,t,r,i,a,n,s,u,l,p,m=void 0,h=void 0)=>{let g=Math.min(e.outputCount,1+(s?1:0)+(u?1:0)),_=g>1?s:void 0,y=g>1?u:void 0,w=g>1?p.pastSequenceLength:0,S=w+p.kvSequenceLength,x=l&&R.size(l.dims)>0?l:void 0,b=[t,r];_&&R.size(_.dims)>0&&b.push(_),x&&b.push(x),m&&b.push(m),h&&b.push(h);let I=e.compute(au(g,t,r,_,x,p,w,m,h),{inputs:b,outputs:g>1?[-1,1]:[-1]})[0];e.compute(iu(I,p.batchSize,p.numHeads,w,p.sequenceLength,S,m,h),{inputs:m&&h?[I,m,h]:[I],outputs:[]});let k=[I,i];y&&R.size(y.dims)>0&&k.push(y),m&&k.push(m),h&&k.push(h),e.compute(nu(g,I,i,y,p,w,m,h),{inputs:k,outputs:g>1?[0,2]:[0]})},su=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,u={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],p=[{type:12,data:i},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],m=h=>{let g=H("output_q",l[0].dataType,r),_=H("output_k",l[0].dataType,r),y=H("output_v",l[0].dataType,r),w=N("input",l[0].dataType,l[0].dims),S=N("weight",l[1].dataType,l[1].dims),x=N("bias",l[2].dataType,l[2].dims),b=w.type.storage,I=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${b}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${b}, ${s*s}>;
  var<workgroup> tileWeightK: array<${b}, ${s*s}>;
  var<workgroup> tileWeightV: array<${b}, ${s*s}>;
  ${h.registerUniforms(I).declareVariables(w,S,x,g,_,y)}
  ${h.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${b}(0);
    var valueK = ${b}(0);
    var valueV = ${b}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:p}),getShaderSource:m},{inputs:l,outputs:[-1,-1,-1]})},Wp=(e,t)=>{let r=ru(e.inputs,t),[i,a,n]=su(e,r);return cr(e,i,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),ou,uu,lu,Vp,r0=U(()=>{"use strict";Le(),ee(),re(),ke(),ie(),ou=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,n)=>{let s=a.length;if(s!==i.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((u,l)=>{if(u!==i[l])throw new Error(`${n}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},uu=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,n=e[0].dims,s=i?Se(n[n.length-1]):1,u=a==="NHWC"&&n.length>1?s:1,l=R.size(n)/s,p=i,m=p?n.length:n,h=N("x",e[0].dataType,e[0].dims,s),g=N("scale",e[1].dataType,e[1].dims,u),_=N("bias",e[2].dataType,e[2].dims,u),y=N("inputMean",e[3].dataType,e[3].dims,u),w=N("inputVar",e[4].dataType,e[4].dims,u),S=H("y",e[0].dataType,m,s),x=()=>{let I="";if(i)I=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")I=`
            ${S.indicesSet("outputIndices","0","0")}
            let cOffset = ${S.indicesToOffset("outputIndices")};`;else{I=`var cIndices = ${g.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let k=1;k<g.rank;k++)I+=`cIndices[${k}] = outputIndices[${k}];`;I+=`let cOffset = ${g.indicesToOffset("cIndices")};`}return I},b=I=>`
  const epsilon = ${r};
  ${I.registerUniform("outputSize","u32").declareVariables(h,g,_,y,w,S)}
  ${I.mainStart()}
  ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${S.offsetToIndices(`global_idx * ${s}`)};
    ${x()}
    let scale = ${g.getByOffset("cOffset")};
    let bias = ${_.getByOffset("cOffset")};
    let inputMean = ${y.getByOffset("cOffset")};
    let inputVar = ${w.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${S.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:p?["rank","type","type","type","type"]:void 0},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p?[{type:12,data:l},...Z(n)]:[{type:12,data:l}]})}},lu=e=>he(e),Vp=(e,t)=>{let{inputs:r,outputCount:i}=e,a=lu({...t,outputCount:i});if(be.webgpu.validateInputContent&&ou(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(uu(r,a))}}),du,pu,Gp,i0=U(()=>{"use strict";re(),ie(),du=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},pu=e=>{let t=e[0].dims,r=e[0].dims[2],i=R.size(t)/4,a=e[0].dataType,n=N("input",a,t,4),s=N("bias",a,[r],4),u=N("residual",a,t,4),l=H("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:p=>`
  const channels = ${r}u / 4;
  ${p.declareVariables(n,s,u,l)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},Gp=e=>{du(e.inputs),e.compute(pu(e.inputs))}}),cu,ce,Hp,Fp,jp,Kp,Zp,Xp,Qp,Yp,Jp,hu,ec,tc,rc,ic,or,ac,qr,nc,sc,oc,uc,lc,dc,pc,cc,hc,fc,mc,gc,yc,_c,bc,$c,qi,wc,va,xa,vc,xc,Sc,fu,mu,kc,ja=U(()=>{"use strict";ee(),re(),ke(),ie(),cu=(e,t,r,i,a,n,s)=>{let u=Math.ceil(t/4),l="";typeof a=="string"?l=`${a}(a)`:l=a("a");let p=N("inputData",r,[u],4),m=H("outputData",i,[u],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(p,m)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${p.getByOffset("global_idx")};
    ${m.setByOffset("global_idx",l)}
  }`},ce=(e,t,r,i,a,n=e.dataType,s,u)=>{let l=[{type:12,data:Math.ceil(R.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:p=>cu(p,R.size(e.dims),e.dataType,n,r,i,u),getRunData:p=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(R.size(p[0].dims)/64/4)},programUniforms:l})}},Hp=e=>{e.compute(ce(e.inputs[0],"Abs","abs"))},Fp=e=>{e.compute(ce(e.inputs[0],"Acos","acos"))},jp=e=>{e.compute(ce(e.inputs[0],"Acosh","acosh"))},Kp=e=>{e.compute(ce(e.inputs[0],"Asin","asin"))},Zp=e=>{e.compute(ce(e.inputs[0],"Asinh","asinh"))},Xp=e=>{e.compute(ce(e.inputs[0],"Atan","atan"))},Qp=e=>{e.compute(ce(e.inputs[0],"Atanh","atanh"))},Yp=e=>he(e),Jp=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ce(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},hu=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return he({min:t,max:r})},ec=(e,t)=>{let r=t||hu(e.inputs),i=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},tc=e=>{e.compute(ce(e.inputs[0],"Ceil","ceil"))},rc=e=>{e.compute(ce(e.inputs[0],"Cos","cos"))},ic=e=>{e.compute(ce(e.inputs[0],"Cosh","cosh"))},or=e=>he(e),ac=(e,t)=>{let r=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},qr=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,nc=e=>{let t=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,qr(t)))},sc=e=>{e.compute(ce(e.inputs[0],"Exp","exp"))},oc=e=>{e.compute(ce(e.inputs[0],"Floor","floor"))},uc=e=>{let t=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,qr(t)))},lc=(e,t)=>{let r=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},dc=e=>{e.compute(ce(e.inputs[0],"Not",t=>`!${t}`))},pc=e=>{e.compute(ce(e.inputs[0],"Neg",t=>`-${t}`))},cc=e=>{e.compute(ce(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},hc=e=>{let t=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},fc=e=>{e.compute(ce(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},mc=e=>he(e),gc=(e,t)=>{let r=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},yc=e=>{e.compute(ce(e.inputs[0],"Sin","sin"))},_c=e=>{e.compute(ce(e.inputs[0],"Sinh","sinh"))},bc=e=>{e.compute(ce(e.inputs[0],"Sqrt","sqrt"))},$c=e=>{e.compute(ce(e.inputs[0],"Tan","tan"))},qi=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,wc=e=>{e.compute(ce(e.inputs[0],"Tanh",qi))},va=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${qi("v")};
}
`,xa=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,vc=e=>{let t=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"FastGelu",xa,va(t),void 0,e.inputs[0].dataType))},xc=(e,t)=>{let r=Oe(e.inputs[0].dataType);return e.compute(ce(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Sc=e=>{e.compute(ce(e.inputs[0],"Log","log"))},fu=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,mu=e=>`quick_gelu_impl(${e})`,kc=(e,t)=>{let r=Oe(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"QuickGelu",mu,fu(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),gu,yu,Tc,a0=U(()=>{"use strict";re(),ie(),ja(),gu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},yu=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=N("input",e[0].dataType,e[0].dims,4),i=N("bias",e[0].dataType,[e[0].dims[2]],4),a=H("output",e[0].dataType,t,4),n=R.size(t)/4,s=Ie(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(r,i,a)}

  ${qr(s)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Tc=e=>{gu(e.inputs),e.compute(yu(e.inputs))}}),_u,bu,je,Ic,Ec,zc,Cc,Ac,Oc,Rc,Bc,Nc,Mc,n0=U(()=>{"use strict";ee(),re(),ie(),_u=(e,t,r,i,a,n,s,u,l,p,m,h)=>{let g,_;typeof u=="string"?g=_=(b,I)=>`${u}((${b}),(${I}))`:typeof u=="function"?g=_=u:(g=u.scalar,_=u.vector);let y=H("outputData",m,i.length,4),w=N("aData",l,t.length,4),S=N("bData",p,r.length,4),x;if(a)if(n){let b=R.size(t)===1,I=R.size(r)===1,k=t.length>0&&t[t.length-1]%4===0,E=r.length>0&&r[r.length-1]%4===0;b||I?x=y.setByOffset("global_idx",_(b?`${w.type.value}(${w.getByOffset("0")}.x)`:w.getByOffset("global_idx"),I?`${S.type.value}(${S.getByOffset("0")}.x)`:S.getByOffset("global_idx"))):x=`
            let outputIndices = ${y.offsetToIndices("global_idx * 4u")};
            let offsetA = ${w.broadcastedIndicesToOffset("outputIndices",y)};
            let offsetB = ${S.broadcastedIndicesToOffset("outputIndices",y)};
            ${y.setByOffset("global_idx",_(s||k?w.getByOffset("offsetA / 4u"):`${w.type.value}(${w.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||E?S.getByOffset("offsetB / 4u"):`${S.type.value}(${S.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else x=y.setByOffset("global_idx",_(w.getByOffset("global_idx"),S.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let b=(I,k,E="")=>{let z=`aData[indexA${k}][componentA${k}]`,O=`bData[indexB${k}][componentB${k}]`;return`
            let outputIndices${k} = ${y.offsetToIndices(`global_idx * 4u + ${k}u`)};
            let offsetA${k} = ${w.broadcastedIndicesToOffset(`outputIndices${k}`,y)};
            let offsetB${k} = ${S.broadcastedIndicesToOffset(`outputIndices${k}`,y)};
            let indexA${k} = offsetA${k} / 4u;
            let indexB${k} = offsetB${k} / 4u;
            let componentA${k} = offsetA${k} % 4u;
            let componentB${k} = offsetB${k} % 4u;
            ${I}[${k}] = ${E}(${g(z,O)});
          `};m===9?x=`
            var data = vec4<u32>(0);
            ${b("data",0,"u32")}
            ${b("data",1,"u32")}
            ${b("data",2,"u32")}
            ${b("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:x=`
            ${b("outputData[global_idx]",0)}
            ${b("outputData[global_idx]",1)}
            ${b("outputData[global_idx]",2)}
            ${b("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(w,S,y)}

        ${h??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${x}
      }`},bu=(e,t,r,i,a,n,s=r.dataType)=>{let u=r.dims.map(Number),l=i.dims.map(Number),p=!R.areEqual(u,l),m=u,h=R.size(u),g=!1,_=!1,y=[p];if(p){let w=Wt.calcShape(u,l,!1);if(!w)throw new Error("Can't perform binary op on the given tensors");m=w.slice(),h=R.size(m);let S=R.size(u)===1,x=R.size(l)===1,b=u.length>0&&u[u.length-1]%4===0,I=l.length>0&&l[l.length-1]%4===0;y.push(S),y.push(x),y.push(b),y.push(I);let k=1;for(let E=1;E<m.length;E++){let z=u[u.length-E],O=l[l.length-E];if(z===O)k*=z;else break}k%4===0?(_=!0,g=!0):(S||x||b||I)&&(g=!0)}else g=!0;return y.push(g),{name:e,shaderCache:{hint:t+y.map(w=>w.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:w=>_u(w,u,l,m,g,p,_,a,r.dataType,i.dataType,s,n),getRunData:()=>({outputs:[{dims:m,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(R.size(m)/4)},...Z(u,l,m)]})}},je=(e,t,r,i,a,n)=>{e.compute(bu(t,a??"",e.inputs[0],e.inputs[1],r,i,n))},Ic=e=>{je(e,"Add",(t,r)=>`${t}+${r}`)},Ec=e=>{je(e,"Div",(t,r)=>`${t}/${r}`)},zc=e=>{je(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Cc=e=>{je(e,"Mul",(t,r)=>`${t}*${r}`)},Ac=e=>{let t=N("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;je(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},Oc=e=>{je(e,"Sub",(t,r)=>`${t}-${r}`)},Rc=e=>{je(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},Bc=e=>{je(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Nc=e=>{je(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Mc=e=>{je(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),$u,wu,vu,xu,Dc,Uc,s0=U(()=>{"use strict";ee(),re(),ke(),ie(),$u=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,n=i.dims.length;e.forEach((s,u)=>{if(u!==r){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((l,p)=>{if(p!==t&&l!==i.dims[p])throw new Error("non concat dimensions must match")})}})},wu=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,vu=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(n):a===0?i.push(`if (inputIndex == ${a}u) { ${n} }`):a===r-1?i.push(`else { ${n} }`):i.push(`else if (inputIndex == ${a}) { ${n} }`)}return i.join(`
`)},xu=(e,t,r,i)=>{let a=R.size(r),n=new Array(e.length),s=new Array(e.length),u=0,l=[],p=[],m=[{type:12,data:a}];for(let w=0;w<e.length;++w)u+=e[w].dims[t],n[w]=u,p.push(e[w].dims.length),s[w]=N(`input${w}`,i,p[w]),l.push("rank"),m.push({type:12,data:n[w]});for(let w=0;w<e.length;++w)m.push(...Z(e[w].dims));m.push(...Z(r));let h=H("output",i,r.length),g=h.indicesGet("indices",t),_=Array.from(Array(n.length).keys()).map(w=>`uniforms.sizeInConcatAxis${w}`).join(","),y=w=>`

  ${(()=>{w.registerUniform("outputSize","u32");for(let S=0;S<e.length;S++)w.registerUniform(`sizeInConcatAxis${S}`,"u32");return w.declareVariables(...s,h)})()}

  ${wu(n.length,_)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${g});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${_});
      ${g} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${vu(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:m}),getShaderSource:y}},Dc=(e,t)=>{let r=e.inputs,i=r[0].dims,a=R.normalizeAxis(t.axis,i.length);$u(r,a);let n=i.slice();n[a]=r.reduce((u,l)=>u+(l.dims.length>a?l.dims[a]:0),0);let s=r.filter(u=>R.size(u.dims)>0);e.compute(xu(s,a,n,r[0].dataType),{inputs:s})},Uc=e=>he({axis:e.axis})}),Rt,Bt,Nt,Ka,Dt=U(()=>{"use strict";ee(),re(),Rt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Bt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Nt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ka=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[dp,pp];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ce,Pc,Za=U(()=>{"use strict";Ce=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},Pc=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),qc,o0=U(()=>{"use strict";qc=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),lr,Xa,Qa=U(()=>{"use strict";ee(),re(),ie(),Dt(),lr=(e,t,r,i,a)=>{let n=i-r;return`
      ${Array.from({length:r}).map((s,u)=>`
      if (${j(t.shape,u,t.rank)} != 1) {
        ${t.indicesSet(e,u,j(a,u+n,i))}
      } else {
        ${t.indicesSet(e,u,0)}
      }`).join("")}
`},Xa=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,l=s[s.length-2],p=u[u.length-1],m=s[s.length-1],h=Se(p),g=Se(m),_=Se(l),y=R.size(r)/h/_,w=e.length>2,S=i?i.slice(0,-2):r.slice(0,-2),x=[R.size(S),l,p],b=[{type:12,data:y},{type:12,data:l},{type:12,data:p},{type:12,data:m}];Bt(t,b),b.push(...Z(S,s,u)),w&&b.push(...Z(e[2].dims)),b.push(...Z(x));let I=k=>{let E=Ga("batch_dims",e[0].dataType,S.length),z=N("a",e[0].dataType,s.length,g),O=N("b",e[1].dataType,u.length,h),v=H("output",e[0].dataType,x.length,h),D=Ie(v.type.tensor),L=Rt(t,v.type.value,D),X=[z,O],W="";if(w){let A=a?h:1;X.push(N("bias",e[2].dataType,e[2].dims.length,A)),W=`${a?`value += bias[col / ${A}];`:`value += ${v.type.value}(bias[row + i]);`}`}let F=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Nt(t,F);let se=()=>{let A=`var a_data: ${z.type.value};`;for(let P=0;P<g;P++)A+=`
              let b_data${P} = b[(b_offset + (k + ${P}) * uniforms.N + col) / ${h}];`;for(let P=0;P<_;P++){A+=`a_data = a[(a_offset + (row + ${P}) * uniforms.K + k) / ${g}];`;for(let J=0;J<g;J++)A+=`
            values[${P}] = fma(${O.type.value}(a_data${g===1?"":`[${J}]`}), b_data${J}, values[${P}]);
`}return A};return`
  ${k.registerUniforms(F).registerInternalVariables(E).declareVariables(...X,v)}
  ${k.mainStart()}
    ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${_};
    let row = (index1 % stride1) * ${_};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${E.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${lr("a_indices",z,z.rank-2,E.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${O.type.indices};
    ${lr("b_indices",O,O.rank-2,E.rank,"batch_indices")}
    ${O.indicesSet("b_indices",O.rank-2,0)}
    ${O.indicesSet("b_indices",O.rank-1,0)}
    let b_offset = ${O.indicesToOffset("b_indices")};
    var values: array<${v.type.value}, ${_}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${g}) {
      ${se()}
    }
    for (var i = 0u; i < ${_}u; i++) {
      var value = values[i];
      ${W}
      ${L}
      let cur_indices = ${v.type.indices}(batch, row + i, col);
      let offset = ${v.indicesToOffset("cur_indices")};
      ${v.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${g};${_};${a}`,inputDependencies:w?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:b}),getShaderSource:I}}}),Su,ku,Sa,Li,Tu,ka,Iu,Hr,Ya=U(()=>{"use strict";ee(),re(),ie(),Dt(),Qa(),Za(),Su=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,ku=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,Sa=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32)=>{let l=t[1]*e[1],p=t[0]*e[0],m=a?l:n,h=a?n:l,g=m/t[0],_=n/t[1];if(!((a&&g===4&&e[1]===4||!a&&(g===3||g===4))&&m%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${m} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${m/g}>, ${h}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${p/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${l};

  let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${_};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Su(a,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${g===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${ku(a,g)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Li=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Tu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ka=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32,l=!1)=>{let p=e[1]*t[1],m=e[0]*t[0],h=a?p:n,g=a?n:p;if(!(g%t[1]===0&&h%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${g} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let _=g/t[1],y=h/t[0],w=n/t[1],S=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${p};
    let globalColStart = i32(workgroupId.x) * ${m};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${g}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${Li(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${m}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${p};

let tileRowA = i32(localId.y) * ${_};
let tileColA = i32(localId.x) * ${y};
let tileRowB = i32(localId.y) * ${w};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${y}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Li(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${w}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${Tu(a)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${h}>, ${g}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${m}>, ${n}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${S}
  }
`},Iu=(e,t,r,i,a=!1)=>{let[n,s,u,l]=i,p=Ie(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${Ce(e,p)} {
      var value = ${Ce(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${lr("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${Ce(e,p)} {
      var value = ${Ce(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${u.type.indices};
        ${lr("bIndices",u,u.rank-2,n.rank,"batchIndices")}
        ${u.indicesSet("bIndices",u.rank-2,"u32(row)")}
        ${u.indicesSet("bIndices",u.rank-1,"u32(colIn)")}
        value = ${u.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Ce(e,p)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${Ce(e,p)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Hr=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,l=s.slice(0,-2),p=u.slice(0,-2),m=i?i.slice(0,-2):r.slice(0,-2),h=R.size(m),g=s[s.length-2],_=s[s.length-1],y=u[u.length-1],w=_%4===0&&y%4===0,S=g<=8?[4,1,1]:[4,4,1],x=[8,8,1],b=[Math.ceil(y/x[0]/S[0]),Math.ceil(g/x[1]/S[1]),Math.ceil(h/x[2]/S[2])],I=w?4:1,k=[...l,g,_/I],E=k.length,z=[...p,_,y/I],O=z.length,v=[h,g,y/I],D=[{type:6,data:g},{type:6,data:y},{type:6,data:_}];Bt(t,D),D.push(...Z(m,k,z));let L=["rank","rank"],X=e.length>2;X&&(D.push(...Z(e[2].dims)),L.push("rank")),D.push(...Z(v));let W=F=>{let se=m.length,A=Ga("batchDims",e[0].dataType,se,1),P=Ie(e[0].dataType),J=N("a",e[0].dataType,E,I),te=N("b",e[1].dataType,O,I),Q=H("result",e[0].dataType,v.length,I),ae=[J,te];if(X){let $e=a?I:1;ae.push(N("bias",e[2].dataType,e[2].dims.length,$e))}let M=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Nt(t,M);let Y=Ie(Q.type.tensor),K=Rt(t,Q.type.value,Y),G=Iu(I,X,K,[A,J,te,Q],a);return`
  ${F.registerUniforms(M).registerInternalVariables(A).declareVariables(...ae,Q)}
  ${G}
  ${w?Sa(S,x,P,A):ka(S,x,P,A)}
                   `};return{name:"MatMul",shaderCache:{hint:`${S};${t.activation};${w};${a}`,inputDependencies:L},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:b[0],y:b[1],z:b[2]},programUniforms:D}),getShaderSource:W}}}),Eu,Lc,u0=U(()=>{"use strict";ee(),nt(),ie(),Dt(),Za(),o0(),Ya(),Eu=(e,t,r,i,a=!1,n,s=4,u=4,l=4,p="f32")=>{let m=D=>{switch(D){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${p}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},h=D=>{switch(D){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},g=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,_=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,y=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",w=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",S=e?"row":"col",x=e?"col":"row",b=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${S} / outWidth;
    let outCol = ${S} % outWidth;

    let WRow = ${x} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${x} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${x} % inChannels;
    var resData = ${Ce(s,p)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${y} && xCol >= 0 && xCol < ${w}) {
      ${g}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${m(s)}
    }
    return resData;`,I=e?t&&i?`
    let col = colIn * ${s};
    ${b}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${b}
    }
    return ${Ce(s,p)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${b}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${b}
    }
    return ${Ce(s,p)}(0.0);`,k=e?i&&r?h(u):`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(u)}
    }
    return ${Ce(u,p)}(0.0);`:`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(u)}
    }
    return ${Ce(u,p)}(0.0);`,E=Ce(l,p),z=Ce(e?s:u,p),O=Ce(e?u:s,p),v=Rt(n,E,p);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?I:k}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${O} {
      ${e?k:I}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${E}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${_}
      ${Pc(a)}
      ${v}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},Lc=(e,t,r,i,a,n,s,u,l)=>{let p=t.format==="NHWC",m=p?e[0].dims[3]:e[0].dims[1],h=r[0],g=p?r[2]:r[3],_=p?r[1]:r[2],y=p?r[3]:r[1],w=p&&(m%4===0||m%3===0)&&y%4===0,S=p?y:g*_,x=p?g*_:y,b=[8,8,1],I=i<=8?[4,1,1]:[4,4,1],k=[Math.ceil(S/b[0]/I[0]),Math.ceil(x/b[1]/I[1]),Math.ceil(h/b[2]/I[2])];de("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${k}`);let E=w?p&&m%4!==0?3:4:1,z=b[1]*I[1],O=b[0]*I[0],v=Math.max(b[0]*E,b[1]),D=i%z===0,L=a%O===0,X=n%v===0,W=w?[E,4,4]:[1,1,1],F=[{type:6,data:i},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Bt(t,F),F.push(...Z(e[0].dims,e[1].dims));let se=["rank","rank"];s&&(F.push(...Z(e[2].dims)),se.push("rank")),F.push(...Z(r));let A=P=>{let J=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Nt(t,J);let te=w?4:1,Q=Ie(e[0].dataType),ae=`
      fn setOutputAtIndex(flatIndex : i32, value : ${w?`vec4<${Q}>`:Q}) {
        result[flatIndex] = ${w?`vec4<${Q}>`:Q}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${w?`vec4<${Q}>`:Q}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${w?"/ 4":""}, value);
      }`,M=N("x",e[0].dataType,e[0].dims.length,E===3?1:E),Y=N("w",e[1].dataType,e[1].dims.length,te),K=[M,Y],G=H("result",e[0].dataType,r.length,te);if(s){let $e=N("bias",e[2].dataType,e[2].dims.length,te);K.push($e),ae+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${w?`vec4<${Q}>`:Q} {
          return bias[coords.${p?"w":"y"}${w?"/ 4":""}];
        }`}return`
        ${qc("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${P.registerUniforms(J).declareVariables(...K,G)}
        ${ae}
        ${Eu(p,D,L,X,s,t,W[0],W[1],W[2],Q)}
        ${w?Sa(I,b,Q,void 0,!p,v):ka(I,b,Q,void 0,!p,v,!1,void 0,u)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${E};${w};${D};${L};${X};${z};${O};${v}`,inputDependencies:se},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:k[0],y:k[1],z:k[2]},programUniforms:F}),getShaderSource:A}}}),zu,Wi,Jt,Cu,Vi,Au,Wc,Vc,l0=U(()=>{"use strict";ee(),nt(),re(),ie(),Dt(),Za(),zu=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Wi=e=>typeof e=="number"?[e,e,e]:e,Jt=(e,t)=>t<=1?e:e+(e-1)*(t-1),Cu=(e,t,r,i=1)=>{let a=Jt(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},Vi=(e,t,r,i,a)=>{a==null&&(a=Cu(e,t[0],i[0]));let n=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/i[s]+1));return n},Au=(e,t,r,i,a,n,s,u,l,p)=>{let m,h,g,_;if(e==="VALID"&&(e=0),typeof e=="number"){m={top:e,bottom:e,left:e,right:e,front:e,back:e};let y=Vi([t,r,i,1],[u,l,p],1,[a,n,s],e);h=y[0],g=y[1],_=y[2]}else if(Array.isArray(e)){if(!e.every((w,S,x)=>w===x[0]))throw Error(`Unsupported padding parameter: ${e}`);m={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let y=Vi([t,r,i,1],[u,l,p],1,[a,n,s],e[0]);h=y[0],g=y[1],_=y[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/a),g=Math.ceil(r/n),_=Math.ceil(i/s);let y=(h-1)*a+u-t,w=(g-1)*n+l-r,S=(_-1)*s+p-i,x=Math.floor(y/2),b=y-x,I=Math.floor(w/2),k=w-I,E=Math.floor(S/2),z=S-E;m={top:I,bottom:k,left:E,right:z,front:x,back:b}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:m,outDepth:h,outHeight:g,outWidth:_}},Wc=(e,t,r,i,a,n=!1,s="channelsLast")=>{let u,l,p,m,h;if(s==="channelsLast")[u,l,p,m,h]=e;else if(s==="channelsFirst")[u,h,l,p,m]=e;else throw new Error(`Unknown dataFormat ${s}`);let[g,,_,y,w]=t,[S,x,b]=Wi(r),[I,k,E]=Wi(i),z=Jt(_,I),O=Jt(y,k),v=Jt(w,E),{padInfo:D,outDepth:L,outHeight:X,outWidth:W}=Au(a,l,p,m,S,x,b,z,O,v),F=n?g*h:g,se=[0,0,0,0,0];return s==="channelsFirst"?se=[u,F,L,X,W]:s==="channelsLast"&&(se=[u,L,X,W,F]),{batchSize:u,dataFormat:s,inDepth:l,inHeight:p,inWidth:m,inChannels:h,outDepth:L,outHeight:X,outWidth:W,outChannels:F,padInfo:D,strideDepth:S,strideHeight:x,strideWidth:b,filterDepth:_,filterHeight:y,filterWidth:w,effectiveFilterDepth:z,effectiveFilterHeight:O,effectiveFilterWidth:v,dilationDepth:I,dilationHeight:k,dilationWidth:E,inShape:e,outShape:se,filterShape:t}},Vc=(e,t,r,i,a,n)=>{let s=n==="channelsLast",u=s?e[0].dims[3]:e[0].dims[1],l=!1,p=[64,1,1],m={x:r.map((b,I)=>I)},h=[Math.ceil(zu(m.x.map(b=>r[b]))/p[0]),1,1];de("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${h}`);let g=l?s&&u%4!==0?3:4:1,_=R.size(r),y=[{type:12,data:_},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Bt(t,y),y.push(...Z(e[0].dims,e[1].dims));let w=["rank","rank"],S=e.length===3;S&&(y.push(...Z(e[2].dims)),w.push("rank")),y.push(...Z(r));let x=b=>{let I=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Nt(t,I);let k=l?4:1,E=Ie(e[0].dataType),z=N("x",e[0].dataType,e[0].dims.length,g===3?1:g),O=N("W",e[1].dataType,e[1].dims.length,k),v=[z,O],D=H("result",e[0].dataType,r.length,k),L="";if(S){let F=N("bias",e[2].dataType,e[2].dims.length,k);v.push(F),L+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${l?`vec4<${E}>`:E} {
          return bias[${s?j("coords",4,5):j("coords",1,5)}${l?"/ 4":""}];
        }`}let X=Ce(g,E),W=Rt(t,X,E);return`
            ${L}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${z.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${O.getByIndices("aIndices")};
            }
          ${b.registerUniforms(I).declareVariables(...v,D)}
          ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${D.offsetToIndices("global_idx")};
              let batch = ${j("coords",0,z.rank)};
              let d2 = ${s?j("coords",z.rank-1,z.rank):j("coords",1,z.rank)};
              let xFRCCorner = vec3<u32>(${s?j("coords",1,z.rank):j("coords",2,z.rank)},
              ${s?j("coords",2,z.rank):j("coords",3,z.rank)},
              ${s?j("coords",3,z.rank):j("coords",4,z.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?j("uniforms.x_shape",1,z.rank):j("uniforms.x_shape",2,z.rank)};
              let xShapeZ = ${s?j("uniforms.x_shape",2,z.rank):j("uniforms.x_shape",3,z.rank)};
              let xShapeW = ${s?j("uniforms.x_shape",3,z.rank):j("uniforms.x_shape",4,z.rank)};
              let xShapeU = ${s?j("uniforms.x_shape",4,z.rank):j("uniforms.x_shape",1,z.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${S?"value = value + getBiasByOutputCoords(coords)":""};
              ${W}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${g};${S}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:h[0],y:h[1],z:h[2]},programUniforms:y}),getShaderSource:x}}}),Gc,Hc,d0=U(()=>{"use strict";ee(),re(),ie(),Dt(),Gc=(e,t,r,i)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,u=e[1].dims,l=t.format==="NHWC",p=l?r[3]:r[1],m=p/t.group,h=l&&m>=4?Se(p):1,g=R.size(r)/h,_=[{type:12,data:g},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:m}];Bt(t,_),_.push(...Z(s,[u[0],u[1],u[2],u[3]/h]));let y=a?["rank","rank","rank"]:["rank","rank"];_.push(...Z([r[0],r[1],r[2],r[3]/h]));let w=S=>{let x=H("output",e[0].dataType,r.length,h),b=Ie(x.type.tensor),I=Rt(t,x.type.value,b),k=N("x",e[0].dataType,s.length),E=N("w",e[1].dataType,u.length,h),z=[k,E];a&&z.push(N("b",e[2].dataType,e[2].dims,h));let O=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Nt(t,O);let v=l?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${k.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${E.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${k.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${E.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${S.registerUniforms(O).declareVariables(...z,x)}

  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${x.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${l?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${l?1:2}], outputIndices[${l?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${h} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${l?2:1}];

    var value: ${x.type.value} = ${x.type.value}(0);
    ${v}
    ${n}
    ${I}
    ${x.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:w}},Hc=(e,t,r,i)=>{let a=e.length>2,n=Se(r[3]),s=Se(r[2]),u=R.size(r)/n/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],p=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],m=[r[0],r[1],r[2],r[3]/n],h=[{type:12,data:u},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Bt(t,h),h.push(...Z(l,p,m));let g=(s-1)*t.strides[1]+p[1],_=y=>{let w=H("output",e[0].dataType,m.length,n),S=Ie(w.type.tensor),x=Rt(t,w.type.value,S),b=N("x",e[0].dataType,l.length,n),I=N("w",e[1].dataType,p.length,n),k=[b,I];a&&k.push(N("b",e[2].dataType,e[2].dims,n));let E=a?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Nt(t,z),`
  ${y.registerUniforms(z).declareVariables(...k,w)}
  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${b.type.value}, ${g}>;
    var values: array<${w.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${p[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${g}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${b.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${b.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${p[1]}; w_width++) {
          let w_val = ${I.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${E}
      ${x}
      ${w.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${g};${p[0]};${p[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:h}),getShaderSource:_}}}),Ou,Rr,Ru,Br,Ta,Gi,Bu,Nu,Ia,p0=U(()=>{"use strict";re(),u0(),l0(),Ya(),d0(),Dt(),Qa(),_t(),Ou=(e,t,r,i,a,n)=>{let s=e[0],u=e.slice(n?1:2,n?3:4),l=u.length,p=t[0],m=t.slice(2).map((g,_)=>g+(g-1)*(r[_]-1)),h=u.map((g,_)=>g+i[_]+i[_+l]).map((g,_)=>Math.floor((g-m[_]+a[_])/a[_]));return h.splice(0,0,s),h.splice(n?3:1,0,p),h},Rr=[2,3,1,0],Ru=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Br=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let n=2;n<t[1].dims.length;++n)r[n-2]===0&&(r[n-2]=t[1].dims[n]);let i=e.pads.slice();Vr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},Ta=e=>{let t=Ka(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,u=e.pads,l=e.strides,p=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Gi=(e,t,r,i)=>{let a=r.format==="NHWC",n=Ou(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let z=[t[0]];if(a){let O=e.kernelCustomData.wT??e.compute(De(t[1],Rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=O),z.push(O)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Hc(z,r,n,i),{inputs:z}):e.compute(Gc(z,r,n,i),{inputs:z});return}let s=t.length===3,u=t[0].dims[a?1:2],l=t[0].dims[a?2:3],p=t[0].dims[a?3:1],m=t[1].dims[2],h=t[1].dims[3],g=n[a?1:2],_=n[a?2:3],y=n[a?3:1],w=a&&m===u&&h===l&&r.pads[0]===0&&r.pads[1]===0;if(w||m===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=n[0],O,v,D,L=[];if(a){let F=e.kernelCustomData.wT??e.compute(De(t[1],Rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=F),w){let se=u*l*p;O=t[0].reshape([1,z,se]),v=F.reshape([1,se,y]),D=[1,z,y]}else O=t[0].reshape([z,u*l,p]),v=F.reshape([1,p,y]),D=[z,g*_,y];L.push(O),L.push(v)}else O=t[0].reshape([z,p,u*l]),v=t[1].reshape([1,y,p]),D=[z,y,g*_],L.push(v),L.push(O);s&&L.push(t[2]);let X=D[2],W=L[0].dims[L[0].dims.length-1];X<8&&W<8?e.compute(Xa(L,r,n,D,a,i),{inputs:L}):e.compute(Hr(L,r,n,D,a,i),{inputs:L});return}let S=!0,x=e.kernelCustomData.wT??e.compute(De(t[1],Rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=x);let b=[t[0],x];s&&b.push(t[2]);let I=a?g*_:y,k=a?y:g*_,E=m*h*p;e.compute(Lc(b,r,n,I,k,E,s,S,i),{inputs:b})},Bu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),u=[1].concat(t.kernelShape),l=Br({...t,pads:a,strides:n,dilations:s,kernelShape:u},i);Gi(e,i,l,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Nu=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=Br(r,t),n=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=Wc(t[0].dims,t[1].dims,r.strides,r.dilations,n,!1,i);e.compute(Vc(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},Ia=(e,t)=>{if(Ru(e.inputs,t),e.inputs[0].dims.length===3)Bu(e,t);else if(e.inputs[0].dims.length===5)Nu(e,e.inputs,t);else{let r=Br(t,e.inputs);Gi(e,e.inputs,r)}}}),Fc,c0=U(()=>{"use strict";ee(),nt(),re(),ie(),Fc=(e,t,r)=>{let i=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,u=e[1].dims,l=u[2]/s,p=u[3],m=n?Se(l):1,h=n&&p===1&&l>=4,g=h?Math.floor(l/4)*4:Math.floor(l/m)*m,_=l-g,y=n?Se(p):1,w=n?p===1?m:y:1,S=R.size(a)/y,x=[Math.ceil(S/64),1,1];de("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${x}`);let b=["rank","rank"],I=[t.strides[0],t.strides[1]],k=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],E=[t.dilations[0],t.dilations[1]],z=[k[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),k[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],O=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],v=[{type:12,data:S},{type:12,data:I},{type:12,data:k},{type:12,data:E},{type:12,data:z},{type:6,data:O},{type:12,data:g},{type:12,data:l},{type:12,data:p},...Z(e[0].dims,e[1].dims)];i&&(v.push(...Z(e[2].dims)),b.push("rank")),v.push(...Z(a));let D=L=>{let X=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:I.length},{name:"filter_dims",type:"u32",length:k.length},{name:"dilations",type:"u32",length:k.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:O.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],W=Ie(e[0].dataType),F=n?1:2,se=n?2:3,A=n?3:1,P=N("W",e[1].dataType,e[1].dims.length,w),J=N("Dy",e[0].dataType,e[0].dims.length,m),te=[J,P];i&&te.push(N("bias",e[2].dataType,[a[A]].length,y));let Q=H("result",e[0].dataType,a.length,y),ae=()=>{let K="";if(h)m===4?K+=`
        let xValue = ${J.getByOffset("x_offset")};
        let wValue = ${P.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:m===2?K+=`
          dotProd = dotProd + dot(vec4<${W}>(${J.getByOffset("x_offset")}, ${J.getByOffset("x_offset + 1u")}), vec4<${W}>(${P.getByOffset("w_offset")}, ${P.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:m===1&&(K+=`
          dotProd = dotProd + dot(vec4<${W}>(${J.getByOffset("x_offset")}, ${J.getByOffset("x_offset + 1u")}, ${J.getByOffset("x_offset + 2u")}, ${J.getByOffset("x_offset + 3u")}), vec4<${W}>(${P.getByOffset("w_offset")}, ${P.getByOffset("w_offset + 1u")}, ${P.getByOffset("w_offset + 2u")}, ${P.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(K+=`
                  let xValue = ${n?J.getByOffset(`${J.indicesToOffset(`${J.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${m}`):J.get("batch","inputChannel","idyR","idyC")};
        `,m===1)K+=`
          let w_offset = ${P.indicesToOffset(`${P.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${P.getByOffset(`w_offset / ${w}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let G=0;G<m;G++)K+=`
            let wValue${G} = ${P.getByOffset(`${P.indicesToOffset(`${P.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${G}, wOutChannel)`)} / ${w}`)};
            dotProd = dotProd + xValue[${G}] * wValue${G};`;return K},M=()=>{if(_===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let K="";if(m===1){K+="dotProd = dotProd";for(let G=0;G<_;G++)K+=`
            + ${J.getByOffset(`x_offset + ${G}`)} * ${P.getByOffset(`w_offset + ${G}`)}`;K+=";"}else if(m===2){if(_!==2)throw new Error(`Invalid inputChannelsRemainder ${_}.`);K+=`
          let xValue = ${J.getByOffset("x_offset")};
          let wValue = ${P.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return K},Y=`
            let outputIndices = ${Q.offsetToIndices(`global_idx * ${y}`)};
            let batch = ${Q.indicesGet("outputIndices",0)};
            let d1 = ${Q.indicesGet("outputIndices",A)};
            let r = ${Q.indicesGet("outputIndices",F)};
            let c = ${Q.indicesGet("outputIndices",se)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${Q.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${W}(dyRCorner) + ${W}(wR)) / ${W}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${W}(uniforms.Dy_shape[${F}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${W}(dyCCorner) + ${W}(wC)) / ${W}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${W}(uniforms.Dy_shape[${se}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${J.indicesToOffset(`${J.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${m};
                var w_offset = ${P.indicesToOffset(`${P.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${w};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:m}) {
                  ${ae()}
                  inputChannel = inputChannel + ${h?4:m};
                }
                ${M()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${y}]`:""};
            ${Q.setByOffset("global_idx","value")};
          `;return`
    ${L.registerUniforms(X).declareVariables(...te,Q)}
      ${L.mainStart()}
      ${L.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${Y}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${m}${w}${y}${h}${_}`,inputDependencies:b},getRunData:()=>({dispatchGroup:{x:x[0],y:x[1],z:x[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:v}),getShaderSource:D}}}),Mu,Du,Uu,Hi,jc,Pu,Fi,qu,Kc,h0=U(()=>{"use strict";c0(),Dt(),_t(),Mu=(e,t,r,i,a,n)=>(e-1)*t+r+(i-1)*a+1-n,Du=(e,t,r,i,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=n,r[a]=e-n):t==="SAME_LOWER"&&(r[i]=e-n,r[a]=n)},Uu=(e,t,r,i,a,n,s,u,l,p)=>{let m=e.length-2,h=p.length===0;l.length<m&&l.push(...Array(m-l.length).fill(0));let g=e[0],_=t[u?3:1]*a;for(let y=0,w=e.length-m-(u?1:0);y<m;++y,++w){let S=e[w],x=h?S*s[y]:p[y],b=Mu(S,s[y],n[y],t[w],r[y],x);Du(b,i,n,y,y+m),h&&p.push(s[y]*(S-1)+l[y]+(t[w]-1)*r[y]+1-n[y]-n[y+m])}p.splice(0,0,g),p.splice(u?3:1,0,_)},Hi=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,g)=>h*g,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),u=t[0].dims,l=e.dilations.slice();if(l.reduce((h,g)=>h+g,0)===0){let h=t[0].dims.length-2;l=new Array(h).fill(1)}let p=e.strides.slice();if(p.reduce((h,g)=>h+g,0)===0){let h=t[0].dims.length-2;p=new Array(h).fill(1)}Uu(u,r,l,e.autoPad,e.group,a,p,i,s,n);let m=Object.assign({},e);return Object.assign(m,{kernelShape:r,pads:a,outputPadding:s,outputShape:n,dilations:l,strides:p}),m},jc=e=>{let t=Ka(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group??1,s=e.kernelShape,u=e.pads,l=e.strides,p=e.wIsConst(),m=e.outputPadding,h=e.outputShape;return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,outputPadding:m,outputShape:h,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Pu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,u)=>s+u,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,u)=>s+u,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,u)=>s+u,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,u)=>s+u,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Fi=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(De(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(Fc(n,r,i),{inputs:n})},qu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let u=t.pads;u.length===0&&(u=[0,0]),u=[0,u[0],0,u[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let l=t.outputPadding;l=[0].concat(l);let p=Hi({...t,pads:u,strides:s,dilations:n,kernelShape:a,outputPadding:l},i);Fi(e,i,p,m=>r?[m[0],m[2],m[3]]:[m[0],m[1],m[3]])},Kc=(e,t)=>{if(Pu(e.inputs,t),e.inputs[0].dims.length===3)qu(e,t);else{let r=Hi(t,e.inputs);Fi(e,e.inputs,r)}}}),Lu,Zc,Xc,f0=U(()=>{"use strict";ee(),re(),ke(),ie(),Lu=(e,t,r,i)=>{let a=R.size(t),n=t.length,s=N("input",e,n),u=H("output",e,n),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),p=R.normalizeAxis(l,n),m=h=>{let g=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,_=j("uniforms.input_shape","uniforms.axis",n),y=i.reverse?g+(i.exclusive?" + 1":""):"0",w=i.reverse?_:g+(i.exclusive?"":" + 1");return`
                ${h.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,u)}
                ${h.mainStart()}
                  ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${u.offsetToIndices("global_idx")};
                  var sum = ${u.type.value}(0);
                  let first : i32 = ${y};
                  let last : i32 = ${w};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${u.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:p},...Z(t,t)]}),getShaderSource:m}},Zc=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(Lu(i,r,a,t),{inputs:[0]})},Xc=e=>{let t=e.exclusive===1,r=e.reverse===1;return he({exclusive:t,reverse:r})}}),Wu,Vu,Gu,Qc,Yc,m0=U(()=>{"use strict";ee(),re(),ke(),ie(),Wu=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Vu=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let n=0;n<t;++n)a.push(r.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},Gu=(e,t)=>{let r,i,a,n,s,u,l=t.format==="NHWC",p=t.blocksize,m=t.mode==="DCR";l?([r,i,a,n]=e.dims,s=m?[r,i,a,p,p,n/p**2]:[r,i,a,n/p**2,p,p],u=m?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=m?[r,p,p,n/p**2,i,a]:[r,n/p**2,p,p,i,a],u=m?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),g=h.dims.length,_=e.dataType,y=N("a",_,g),w=H("output",_,g),S=x=>`
  ${x.registerUniform("output_size","u32").declareVariables(y,w)}

  ${Vu(u,g,y,w)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${w.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${w.setByOffset("global_idx",y.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:x=>{let b=l?[r,i*p,a*p,n/p**2]:[r,n/p**2,i*p,a*p],I=R.size(b),k=h.dims,E=R.sortBasedOnPerm(k,u);return{outputs:[{dims:b,dataType:x[0].dataType}],dispatchGroup:{x:Math.ceil(I/64)},programUniforms:[{type:12,data:I},...Z(k,E)]}},getShaderSource:S}},Qc=(e,t)=>{Wu(e.inputs),e.compute(Gu(e.inputs[0],t))},Yc=e=>he({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Nr,er,ji,Hu,Fu,ju,Ku,Ki,Zu,Jc,eh,g0=U(()=>{"use strict";ee(),re(),ke(),ie(),Nr="[a-zA-Z]|\\.\\.\\.",er="("+Nr+")+",ji="^"+er+"$",Hu="("+er+",)*"+er,Fu="^"+Hu+"$",ju=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Ku=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Fu)))throw new Error("Invalid LHS term");if(r.split(",").forEach((a,n)=>{let s=e[n].dims.slice();if(!a.match(RegExp(ji)))throw new Error("Invalid LHS term");let u=this.processTerm(a,!0,s,n);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([a,n])=>n.count===1||a==="...").map(([a])=>a).join("");else if(!i.match(RegExp(er)))throw new Error("Invalid RHS");i.match(RegExp(Nr,"g"))?.forEach(a=>{if(a==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let n=this.symbolToInfo.get(a);if(n===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(n.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,n=!1,s=[],u=0;if(!e.match(RegExp(ji))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(Nr,"g")),p=new ju(i);return l?.forEach((m,h)=>{if(m==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let g=a-l.length+1;if(g<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(u,u+g),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let _=0;_<s.length;_++){let y=String.fromCharCode(48+_);p.addSymbol(y,h+_),this.addSymbol(y,r[u++],i)}}else p.addSymbol(m,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(m,r[u++],i)}),p}},Ki=e=>e+"_max",Zu=(e,t,r,i)=>{let a=e.map(p=>p.length).map((p,m)=>N(`input${m}`,t,p)),n=R.size(i),s=H("output",t,i.length),u=[...r.symbolToInfo.keys()].filter(p=>!r.rhs.symbolToIndices.has(p)),l=p=>{let m=[],h="var prod = 1.0;",g="var sum = 0.0;",_="sum += prod;",y=[],w=[],S=[],x=[],b=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((k,E)=>{if(r.rhs.symbolToIndices.has(E)){let z=r.rhs.symbolToIndices.get(E)?.[0];z!==void 0&&r.lhs.forEach((O,v)=>{if(k.inputIndices.includes(v)){let D=O.symbolToIndices.get(E);if(D===void 0)throw new Error("Invalid symbol error");D.forEach(L=>{m.push(`${a[v].indicesSet(`input${v}Indices`,L,s.indicesGet("outputIndices",z))}`)})}})}else r.lhs.forEach((z,O)=>{if(k.inputIndices.includes(O)){let v=z.symbolToIndices.get(E);if(v===void 0)throw new Error("Invalid symbol error");v.forEach(D=>{y.push(`${a[O].indicesSet(`input${O}Indices`,D,`${E}`)}`)}),x.push(`prod *= ${a[O].getByIndices(`input${O}Indices`)};`)}}),w.push(`for(var ${E}: u32 = 0; ${E} < uniforms.${Ki(E)}; ${E}++) {`),S.push("}")});let I=b?[...m,`let sum = ${a.map((k,E)=>k.getByIndices(`input${E}Indices`)).join(" * ")};`]:[...m,g,...w,...y,h,...x,_,...S];return`
            ${p.registerUniforms(u.map(k=>({name:`${Ki(k)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map((k,E)=>`var input${E}Indices: ${a[E].type.indices};`).join(`
`)}
            ${I.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let p=u.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));p.push({type:12,data:n});let m=e.map((h,g)=>[...Z(h)]).reduce((h,g)=>h.concat(g),p);return m.push(...Z(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:m}},getShaderSource:l}},Jc=(e,t)=>{let r=new Ku(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Zu(a,e.inputs[0].dataType,r,i))},eh=e=>{let t=e.equation.replace(/\s+/g,"");return he({equation:t})}}),Xu,Zi,Qu,Yu,th,y0=U(()=>{"use strict";ee(),re(),ie(),Xu=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Zi=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},Qu=(e,t)=>e.length>t.length?Zi(e,t):Zi(t,e),Yu=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Qu(t,r),a=e[0].dataType,n=a===9||R.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,u=n||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(R.size(i)/u),p=h=>{let g=N("input",a,t.length,s),_=H("output",a,i.length,u),y;if(a===9){let w=(S,x,b="")=>`
          let outputIndices${x} = ${_.offsetToIndices(`outputOffset + ${x}u`)};
          let offset${x} = ${g.broadcastedIndicesToOffset(`outputIndices${x}`,_)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${b}(${g.getByOffset(`index${x}`)}[component${x}]);
        `;y=`
        let outputOffset = global_idx * ${u};
        var data = vec4<u32>(0);
        ${w("data",0,"u32")}
        ${w("data",1,"u32")}
        ${w("data",2,"u32")}
        ${w("data",3,"u32")}
        ${_.setByOffset("global_idx","data")}
      }`}else y=`
        let outputIndices = ${_.offsetToIndices(`global_idx * ${u}`)};
        let inputOffset = ${g.broadcastedIndicesToOffset("outputIndices",_)};
        let data = ${_.type.value}(${g.getByOffset(`inputOffset / ${s}`)});
        ${_.setByOffset("global_idx","data")}
      }`;return`
    ${h.registerUniform("vec_size","u32").declareVariables(g,_)}
    ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${y}`},m=[{type:12,data:l},...Z(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${u}`,inputDependencies:["rank"]},getShaderSource:p,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:m})}},th=e=>{Xu(e.inputs),e.compute(Yu(e.inputs),{inputs:[0]})}}),Ju,rh,_0=U(()=>{"use strict";ee(),re(),ie(),ja(),Ju=e=>{let t=e[0].dataType,r=R.size(e[0].dims),i=R.size(e[1].dims),a=i%4===0,n=s=>{let u=N("x",t,[1],4),l=N("bias",t,[1],4),p=H("y",t,[1],4),m=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=_=>`
      let bias${_}_offset: u32 = (global_idx * 4 + ${_}) % uniforms.bias_size;
      let bias${_} = ${l.getByOffset(`bias${_}_offset / 4`)}[bias${_}_offset % 4];`,g=a?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${u.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(m).declareVariables(u,l,p)}

    ${va(Oe(t))}

    ${s.mainStart(Vt)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${u.getByOffset("global_idx")};
      ${g}
      let x_in = x + bias;
      ${p.setByOffset("global_idx",xa("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/Vt/4)}})}},rh=e=>{e.inputs.length<2||R.size(e.inputs[1].dims)===0?vc(e):e.compute(Ju(e.inputs))}}),el,tl,ih,ah,b0=U(()=>{"use strict";ee(),re(),ke(),ie(),el=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},tl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=R.normalizeAxis(t.axis,a),s=r.slice(0);s.splice(n,1,...i);let u=r[n],l=e[0].dataType===9?4:1,p=Math.ceil(R.size(s)/l),m=[{type:12,data:p},{type:6,data:u},{type:12,data:n},...Z(e[0].dims,e[1].dims,s)],h=g=>{let _=N("data",e[0].dataType,e[0].dims.length,l),y=N("inputIndices",e[1].dataType,e[1].dims.length),w=H("output",e[0].dataType,s.length,l),S=b=>{let I=i.length,k=`var indicesIndices${b}  = ${y.type.indices}(0);`;for(let E=0;E<I;E++)k+=`${I>1?`indicesIndices${b}[${E}]`:`indicesIndices${b}`} = ${s.length>1?`outputIndices${b}[uniforms.axis + ${E}]`:`outputIndices${b}`};`;k+=`
          var idx${b} = ${y.getByIndices(`indicesIndices${b}`)};
          if (idx${b} < 0) {
            idx${b} = idx${b} + uniforms.axisDimLimit;
          }
          var dataIndices${b} : ${_.type.indices};
        `;for(let E=0,z=0;E<a;E++)E===n?(k+=`${a>1?`dataIndices${b}[${E}]`:`dataIndices${b}`} = u32(idx${b});`,z+=I):(k+=`${a>1?`dataIndices${b}[${E}]`:`dataIndices${b}`} = ${s.length>1?`outputIndices${b}[${z}]`:`outputIndices${b}`};`,z++);return k},x;if(e[0].dataType===9){let b=(I,k,E="")=>`
          let outputIndices${k} = ${w.offsetToIndices(`outputOffset + ${k}u`)};
          ${S(k)};
          let offset${k} = ${_.indicesToOffset(`dataIndices${k}`)};
          let index${k} = offset${k} / 4u;
          let component${k} = offset${k} % 4u;
          ${I}[${k}] = ${E}(${_.getByOffset(`index${k}`)}[component${k}]);
        `;x=`
        let outputOffset = global_idx * ${l};
        var value = vec4<u32>(0);
        ${b("value",0,"u32")}
        ${b("value",1,"u32")}
        ${b("value",2,"u32")}
        ${b("value",3,"u32")}
        ${w.setByOffset("global_idx","value")}
      `}else x=`
      let outputIndices = ${w.offsetToIndices("global_idx")};
      ${S("")};
      let value = ${_.getByIndices("dataIndices")};
      ${w.setByOffset("global_idx","value")};
      `;return`
      ${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(_,y,w)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${x}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:h}},ih=e=>he({axis:e.axis}),ah=(e,t)=>{let r=e.inputs;el(r),e.compute(tl(e.inputs,t))}}),rl,nh,sh,$0=U(()=>{"use strict";ee(),re(),ie(),rl=(e,t,r,i,a,n,s,u,l)=>{let p=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:s},{type:12,data:u},{type:12,data:l}],m=[n];p.push(...Z(t.dims,m));let h=g=>{let _=N("indices_data",t.dataType,t.dims.length),y=H("input_slice_offsets_data",12,1,1),w=[_,y],S=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${g.registerUniforms(S).declareVariables(...w)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:m,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},nh=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,n=r[1].dims,s=n[n.length-1],u=R.sizeToDimension(n,n.length-1),l=R.sizeFromDimension(i,t.batchDims+s),p=R.sizeToDimension(i,t.batchDims),m=R.sizeFromDimension(i,t.batchDims),h=u/p,g=new Array(s),_=l;for(let k=0;k<s;++k)g[s-1-k]=_,_*=i[t.batchDims+s-1-k];let y=rl(e,r[1],g,t.batchDims,i,u,h,m,s),w=t.batchDims+s;if(w>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let S=n.slice(0,-1).concat(i.slice(w)),x=R.size(S),b=[{type:12,data:x},{type:12,data:l},...Z(r[0].dims,y.dims,S)],I=k=>{let E=N("data",r[0].dataType,r[0].dims.length),z=N("slice_offsets",12,y.dims.length),O=H("output",r[0].dataType,S.length);return`
          ${k.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(E,z,O)}
            ${k.mainStart()}
            ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:S,dataType:a}],dispatchGroup:{x:Math.ceil(x/64)},programUniforms:b}),getShaderSource:I},{inputs:[r[0],y]})},sh=e=>({batchDims:e.batch_dims,cacheKey:""})}),il,al,oh,uh,w0=U(()=>{"use strict";ee(),re(),ke(),ie(),il=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=R.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((u,l)=>l===r?Math.ceil(u/i)===n.dims[l]:u===n.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((u,l)=>u===n.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},al=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=R.normalizeAxis(t.gatherAxis,a),s=R.normalizeAxis(t.quantizeAxis,a),u=r.slice(0);u.splice(n,1,...i);let l=R.size(u),p=e[2].dataType,m=e[0].dataType===22,h=[{type:12,data:l},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...Z(...e.map((_,y)=>_.dims),u)],g=_=>{let y=N("data",e[0].dataType,e[0].dims.length),w=N("inputIndices",e[1].dataType,e[1].dims.length),S=N("scales",e[2].dataType,e[2].dims.length),x=e.length>3?N("zeroPoint",e[3].dataType,e[3].dims.length):void 0,b=H("output",p,u.length),I=[y,w,S];x&&I.push(x);let k=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${_.registerUniforms(k).declareVariables(...I,b)}
        ${_.mainStart()}
        let output_indices = ${b.offsetToIndices("global_idx")};
        var indices_indices = ${w.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${b.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${w.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${b.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${y.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${b.indicesGet("output_indices","i")};
          ${y.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${w.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[n]};
        }
        ${y.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${u.length}; i++) {
          let index = ${b.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${y.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${y.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${y.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${m?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${S.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${S.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${S.getByIndices("scale_indices")};
        ${x?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${x.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${x.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${m?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Oe(p)}(quantized_data - zero_point) * scale;
        ${b.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((_,y)=>y!==1).map(_=>_.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(_,y)=>"rank")},getRunData:()=>({outputs:[{dims:u,dataType:p}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:h}),getShaderSource:g}},oh=(e,t)=>{let r=e.inputs;il(r,t),e.compute(al(e.inputs,t))},uh=e=>he({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),nl,sl,lh,dh,v0=U(()=>{"use strict";ee(),re(),ke(),ie(),nl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},sl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,n=e[1].dims,s=e[1].dataType,u=R.normalizeAxis(t.axis,a),l=r[u],p=n.slice(0),m=R.size(p),h=N("input",i,a),g=N("indicesInput",s,n.length),_=H("output",i,p.length),y=[{type:12,data:m},{type:6,data:l},{type:12,data:u}];return y.push(...Z(r,n,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:y}),getShaderSource:w=>`
      ${w.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,g,_)}
      ${w.mainStart()}
      ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${_.offsetToIndices("global_idx")};

      var idx = ${g.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${h.type.indices}(outputIndices);
      ${h.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${h.getByIndices("inputIndices")};

      ${_.setByOffset("global_idx","value")};
  }`}},lh=e=>he({axis:e.axis}),dh=(e,t)=>{let r=e.inputs;nl(r),e.compute(sl(e.inputs,t))}}),ol,ul,ph,ch,x0=U(()=>{"use strict";ee(),re(),ie(),ol=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},ul=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,n,s]=lp.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),u=[a,n];if(!u)throw new Error("Can't use gemm on the given tensors");let l=16,p=Math.ceil(n/l),m=Math.ceil(a/l),h=!0,g=R.size(u),_=[{type:12,data:h?p:g},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],y=["type","type"];e.length===3&&(_.push(...Z(e[2].dims)),y.push("rank")),_.push(...Z(u));let w=x=>{let b="";t.transA&&t.transB?b="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?b="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?b="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(b="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let I=t.alpha===1?"":"value *= uniforms.alpha;",k=N("a",e[0].dataType,e[0].dims),E=N("b",e[1].dataType,e[1].dims),z=k.type.value,O=null,v=[k,E];e.length===3&&(O=N("c",e[2].dataType,e[2].dims.length),v.push(O));let D=H("output",e[0].dataType,u.length);v.push(D);let L=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${x.registerUniforms(L).declareVariables(...v)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${b}
    }

    ${I}
    ${O!=null?`let cOffset = ${O.broadcastedIndicesToOffset("vec2(m, n)",D)}; value += ${z}(uniforms.beta) * ${O.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},S=x=>{let b=N("a",e[0].dataType,e[0].dims),I=N("b",e[1].dataType,e[1].dims),k=null,E=[b,I];e.length===3&&(k=N("c",e[2].dataType,e[2].dims.length),E.push(k));let z=H("output",e[0].dataType,u.length);E.push(z);let O=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],v="",D="";t.transA&&t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let L=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${x.registerUniforms(O).declareVariables(...E)}
  var<workgroup> tile_a: array<array<${b.type.storage}, ${l}>, ${l}>;
  var<workgroup> tile_b: array<array<${I.type.storage}, ${l}>, ${l}>;
  ${x.mainStart([l,l,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${l};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${l};
    let num_tiles = (uniforms.K - 1) / ${l} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${D}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${v}
      }
      workgroupBarrier();
    }

    ${L}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${k!=null?`let cOffset = ${k.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${k.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:p*m},programUniforms:_}),getShaderSource:S}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:w}},ph=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},ch=(e,t)=>{ol(e.inputs),e.compute(ul(e.inputs,t))}}),et,it,kt,Tt,ll,dl,pl,cl,hl,fl,ml,gl,hh,fh,S0=U(()=>{"use strict";ee(),re(),ke(),ie(),[et,it,kt,Tt]=[0,1,2,3],ll=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},dl=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,pl=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,cl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,hl=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,fl=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${et}] = batch;
     indices[${it}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${kt}] = u32(r);
            indices[${Tt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${kt}] = u32(clamp(r, 0, H - 1));
          indices[${Tt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${kt}] = gs_reflect(r, border[1], border[3]);
          indices[${Tt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,ml=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${et}], indices[${it}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${et}], indices[${it}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${et}], indices[${it}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${et}], indices[${it}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${et}], indices[${it}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${et}], indices[${it}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,gl=(e,t)=>{let r=N("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=N("grid",e[1].dataType,i.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[et,it,kt,Tt]=[0,3,1,2]);let s=H("output",e[0].dataType,n.length),u=r.type.value,l=R.size(n),p=[{type:12,data:l},...Z(e[0].dims,i,n)],m=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,a,s)}
  ${dl}
  ${pl(u)}
  ${cl(t)}
  ${hl(t)}
  ${fl(r,u,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${kt}]);
      let W_in = i32(uniforms.x_shape[${Tt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${et}], indices[${kt}], indices[${Tt}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${ml(s,u,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let g=R.size(n);return{outputs:[{dims:n,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:p}},getShaderSource:m}},hh=(e,t)=>{ll(e.inputs),e.compute(gl(e.inputs,t))},fh=e=>he({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Re,yl,mh,Xi,_l,ur,gh,yh=U(()=>{"use strict";ee(),re(),ke(),Va(),Fa(),ie(),_t(),Re=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,yl=(e,t)=>{let r=e[0],i=Re(e,1),a=Re(e,2),n=Re(e,3),s=Re(e,4),u=Re(e,5),l=Re(e,6),p=Re(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let m=r.dims[0],h=r.dims[1],g=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],_=h,y=0,w=0,S=Math.floor(g/t.numHeads);if(l&&p&&R.size(l.dims)&&R.size(p.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==m||l.dims[1]!==t.numHeads||l.dims[3]!==S)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(p.dims[0]!==m||p.dims[1]!==t.numHeads||p.dims[3]!==S)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==p.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(p.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');y=l.dims[2],w=l.dims[2]}else if(l&&R.size(l.dims)||p&&R.size(p.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x;if(i&&R.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');x=2,_=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==S)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');x=5,_=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==S)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');x=0,_=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}if(n&&R.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let b=y+_,I=0;if(s&&R.size(s.dims)>0){I=8;let O=s.dims;throw O.length===1?O[0]===m?I=1:O[0]===3*m+2&&(I=3):O.length===2&&O[0]===m&&O[1]===b&&(I=5),I===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let k=!1,E=g;if(a&&R.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(_!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');E=a.dims[2]}else{if(_!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');E=a.dims[1]*a.dims[3],k=!0}}let z=!1;if(s&&R.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(u&&R.size(u.dims)>0){if(u.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==m||u.dims[1]!==t.numHeads||u.dims[2]!==h||u.dims[3]!==b)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:m,sequenceLength:h,pastSequenceLength:y,kvSequenceLength:_,totalSequenceLength:b,maxSequenceLength:w,inputHiddenSize:0,hiddenSize:g,vHiddenSize:E,headSize:S,vHeadSize:Math.floor(E/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:I,scale:t.scale,broadcastResPosBias:z,passPastInKv:k,qkvFormat:x}},mh=e=>he({...e}),Xi=he({perm:[0,2,1,3]}),_l=(e,t,r,i,a,n,s)=>{let u=[i,a,n],l=R.size(u),p=[{type:12,data:l},{type:12,data:s},{type:12,data:n}],m=h=>{let g=H("qkv_with_bias",t.dataType,u),_=N("qkv",t.dataType,u),y=N("bias",r.dataType,u),w=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms(w).declareVariables(_,y,g)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:u,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p}),getShaderSource:m},{inputs:[t,r],outputs:[-1]})[0]},ur=(e,t,r,i,a,n,s,u)=>{let l=n;if(s&&R.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=_l(e,n,s,t,i,r*a,u),l=l.reshape([t,i,r,a]),r===1||i===1?l:e.compute(De(l,Xi.perm),{inputs:[l],outputs:[-1]})[0]}else return n.dims.length===3&&(l=n.reshape([t,i,r,a])),r===1||i===1?l:e.compute(De(l,Xi.perm),{inputs:[l],outputs:[-1]})[0]},gh=(e,t)=>{let r=yl(e.inputs,t),i=e.inputs[0],a=Re(e.inputs,1),n=Re(e.inputs,2),s=Re(e.inputs,3),u=Re(e.inputs,4),l=Re(e.inputs,5),p=Re(e.inputs,6),m=Re(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(a?.dims.length===5)throw new Error("Packed KV is not implemented");let h=a&&n&&a.dims.length===4&&n.dims.length===4,g=ur(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(h)return cr(e,g,a,n,u,void 0,p,m,l,r);if(!a||!n)throw new Error("key and value must be provided");let _=ur(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,s,r.hiddenSize),y=ur(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,n,s,2*r.hiddenSize);cr(e,g,_,y,u,void 0,p,m,l,r)}}),bl,$l,wl,vl,Ea,_h,bh,$h=U(()=>{"use strict";ee(),re(),ke(),ie(),bl=e=>{if(!e||e.length<1)throw new Error("too few inputs")},$l=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),he({numOutputs:i,axis:t.axis,splitSizes:r})},wl=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${j("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,vl=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Ea=(e,t)=>{let r=e[0].dims,i=R.size(r),a=e[0].dataType,n=R.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),u=N("input",a,r.length),l=new Array(t.numOutputs),p=[],m=[],h=0,g=[{type:12,data:i}];for(let y=0;y<t.numOutputs;y++){h+=t.splitSizes[y],l[y]=h;let w=r.slice();w[n]=t.splitSizes[y],m.push(w),s[y]=H(`output${y}`,a,w.length),p.push({dims:m[y],dataType:e[0].dataType})}g.push({type:12,data:l},...Z(r,...m));let _=y=>`
  ${y.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(u,...s)}
  ${wl(l.length)}
  ${vl(s)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${u.offsetToIndices("global_idx")};
    var index = ${u.indicesGet("indices",n)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${j("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${u.indicesSet("indices",n,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:p,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:g})}},_h=(e,t)=>{bl(e.inputs);let r=e.inputs.length===1?t:$l(e.inputs,t);e.compute(Ea(e.inputs,r),{inputs:[0]})},bh=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return he({axis:t,numOutputs:i,splitSizes:r})}}),xl,Fr,wh,vh=U(()=>{"use strict";ee(),re(),ke(),ie(),xl=(e,t)=>{let[r,i,a,n]=e,{numHeads:s,rotaryEmbeddingDim:u}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!R.areEqual(i.dims,[])&&!R.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!R.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(u>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],p=r.dims[r.dims.length-2],m=a.dims[0],h=R.sizeFromDimension(r.dims,1)/p,g=u===0?a.dims[1]*2:h/s;if(u>g)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(p!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(p>m)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(g/2!==a.dims[1]&&u/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`)},Fr=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],u=R.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],p=u/l,m=e[2].dims[1],h=a===0?m*2:p/i,g=new Array(s,l,p/h,h-m),_=R.computeStrides(g),y=[{type:1,data:n},{type:12,data:g},{type:12,data:_},...e[0].dims.length===3?new Array({type:12,data:[u,p,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[u,h,l*h,1]}):[],...Z(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],w=S=>{let x=N("input",e[0].dataType,e[0].dims.length),b=N("position_ids",e[1].dataType,e[1].dims.length),I=N("cos_cache",e[2].dataType,e[2].dims.length),k=N("sin_cache",e[3].dataType,e[3].dims.length),E=H("output",e[0].dataType,e[0].dims.length);return S.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:g.length},{name:"global_strides",type:"u32",length:_.length},{name:"input_output_strides",type:"u32",length:_.length}]),`
        ${S.declareVariables(x,b,I,k,E)}

        ${S.mainStart(Vt)}
          let half_rotary_emb_dim = uniforms.${I.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${S.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${b.broadcastedIndicesToOffset("bsnh.xy",H("",b.type.tensor,2))};
            let position_id =
                u32(${b.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${x.getByOffset("i")} * ${I.get("position_id","bsnh[3]")} -
                ${x.getByOffset("j")} * ${k.get("position_id","bsnh[3]")};
            ${E.setByOffset("i","re")}
            let im = ${x.getByOffset("i")} * ${k.get("position_id","bsnh[3]")} +
                ${x.getByOffset("j")} * ${I.get("position_id","bsnh[3]")};
            ${E.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${E.setByOffset("k",x.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:he({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(g)/Vt)},programUniforms:y})}},wh=(e,t)=>{xl(e.inputs,t),e.compute(Fr(e.inputs,t))}}),Sl,kl,Qi,Tl,xh,k0=U(()=>{"use strict";ke(),ee(),Fa(),yh(),$h(),_t(),vh(),ie(),Sl=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let u=!1,l=r.dims[0],p=r.dims[1],m=r.dims.length===3?u?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=p,g=0,_=!i||i.dims.length===0,y=Math.floor(_?m/(t.numHeads+2*t.kvNumHeads):m/t.numHeads);_&&(m=y*t.numHeads);let w=n&&n.dims.length!==0,S=s&&s.dims.length!==0;if(w&&n.dims.length===4&&n.dims[0]===l&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===y)throw new Error("BSNH pastKey/pastValue is not supported");if(w&&S){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=n.dims[2]}else if(w||S)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==y)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');h=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==y)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}let b=0,I=!1,k=t.kvNumHeads?y*t.kvNumHeads:m;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(h!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');k=a.dims[2]}else{if(h!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');k=a.dims[1]*a.dims[3],I=!0}}let E=e.length>4?e[5]:void 0;if(E){if(E.dims.length===0)throw new Error("seqlens_k must be at least 1D, got scalar.");let z=E.dims.reduce((O,v)=>O*v,1);if(z!==l)throw new Error(`seqlens_k must have batch_size (${l}) elements, got ${z}.`);for(let O=0;O<E.dims.length;O++)if(E.dims[O]!==1&&E.dims[O]!==l)throw new Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${l}), got dims[${O}] = ${E.dims[O]}.`)}return{batchSize:l,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:m,vHiddenSize:k,headSize:y,vHeadSize:Math.floor(k/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:I,qkvFormat:x}},kl=he({perm:[0,2,1,3]}),Qi=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(De(i,kl.perm),{inputs:[i],outputs:[-1]})[0]),i},Tl=(e,t,r,i)=>{let a=7,n=["type","type"],s=[e*t],u=e*t,l=[{type:12,data:u},{type:12,data:t},{type:12,data:e}],p=m=>{let h=N("seq_lens",r.dataType,r.dims),g=N("total_seq_lens",i.dataType,i.dims),_=H("pos_ids",a,s),y=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${m.registerUniforms(y).declareVariables(h,g,_)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${g.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${h.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${_.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:p}},xh=(e,t)=>{let r=Sl(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,u=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,p=e.inputs.length>5?e.inputs[6]:void 0,m=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=he({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,m*r.headSize,m*r.headSize]}),[g,_,y]=!a&&!n?e.compute(Ea([i],h),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,n],w,S;if(t.doRotary){let k=e.compute(Tl(r.batchSize,r.sequenceLength,l,p),{inputs:[l,p],outputs:[-1]})[0],E=e.inputs[7],z=e.inputs[8],O=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),v=[g,k,E,z],D=[-1];w=e.compute(Fr(v,O),{inputs:v,outputs:D})[0],v.splice(0,1,_);let L=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});S=e.compute(Fr(v,L),{inputs:v,outputs:D})[0]}let x=ur(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?w:g,void 0,0),b=Qi(e,t.doRotary?S:_,r),I=Qi(e,y,r);cr(e,x,b,I,void 0,void 0,s,u,void 0,r,l,p)}}),Yi,Il,El,Sh,T0=U(()=>{"use strict";ee(),re(),_t(),ie(),Yi=(e,t,r,i,a,n,s,u)=>{let l=Se(n),p=l===1?"f32":`vec${l}f`,m=l===1?"vec2f":`mat2x${l}f`,h=a*s,g=64;h===1&&(g=256);let _=[a,s,n/l],y=[a,s,2],w=["rank","type","type"],S=[];S.push(...Z(_,y));let x=b=>{let I=N("x",t.dataType,3,l),k=N("scale",r.dataType,r.dims),E=N("bias",i.dataType,i.dims),z=H("output",1,3,2),O=[I,k,E,z];return`
  var<workgroup> workgroup_shared : array<${m}, ${g}>;
  const workgroup_size = ${g}u;
  ${b.declareVariables(...O)}
  ${b.mainStart(g)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${p}(0);
    var squared_sum = ${p}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${p}(${I.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${m}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${yt("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${yt("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${u}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${u};${g}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:y,dataType:1}],dispatchGroup:{x:h},programUniforms:S}),getShaderSource:x},{inputs:[t,r,i],outputs:[-1]})[0]},Il=(e,t,r)=>{let i=t[0].dims,a=i,n=2,s=i[0],u=i[1],l=R.sizeFromDimension(i,n),p=Se(l),m=R.size(a)/p,h=Yi(e,t[0],t[1],t[2],s,l,u,r.epsilon),g=[s,u,l/p],_=[s,u],y=["type","none"],w=S=>{let x=N("x",t[0].dataType,g.length,p),b=N("scale_shift",1,_.length,2),I=H("output",t[0].dataType,g.length,p),k=[x,b,I];return`
  ${S.registerUniform("output_size","u32").declareVariables(...k)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${I.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${b.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${x.getByOffset("global_idx")} * ${I.type.value}(scale_shift.x) + ${I.type.value}(scale_shift.y);
      ${I.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${p}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...Z(g,_,g)]}),getShaderSource:w},{inputs:[t[0],h]})},El=(e,t,r)=>{let i=t[0].dims,a=i,n=i[0],s=i[i.length-1],u=R.sizeFromDimension(i,1)/s,l=Se(s),p=R.size(a)/l,m=[{type:12,data:u},{type:12,data:Math.floor(s/l)}],h=["type","type"],g=!1,_=[0,i.length-1];for(let x=0;x<i.length-2;x++)g=g||i[x+1]!==1,_.push(x+1);g=g&&i[i.length-1]!==1;let y=g?e.compute(De(e.inputs[0],_),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(x,b)=>i[_[b]])),w=Yi(e,y,t[1],t[2],n,u,s,r.epsilon),S=x=>{let b=Ie(t[0].dataType),I=l===1?"vec2f":`mat${l}x2f`,k=O=>{let v=O===0?"x":"y",D=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${b}(${D}(scale.${v}))`;case 2:return`vec2<${b}>(${D}(scale[0].${v}, scale[1].${v}))`;case 4:return`vec4<${b}>(${D}(scale[0].${v}, scale[1].${v}, scale[2].${v}, scale[3].${v}))`;default:throw new Error(`Not supported compoents ${l}`)}},E=N("input",t[0].dataType,t[0].dims,l),z=H("output",t[0].dataType,a,l);return`
  @group(0) @binding(0) var<storage, read> input : array<${E.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${I}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${x.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${k(0)}, ${k(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:S},{inputs:[t[0],w]})},Sh=(e,t)=>{t.format==="NHWC"?El(e,e.inputs,t):Il(e,e.inputs,t)}}),zl,Cl,kh,I0=U(()=>{"use strict";ee(),re(),ie(),zl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Cl=(e,t,r)=>{let i=t.simplified,a=e[0].dims,n=e[1],s=!i&&e[2],u=a,l=R.normalizeAxis(t.axis,a.length),p=R.sizeToDimension(a,l),m=R.sizeFromDimension(a,l),h=R.size(n.dims),g=s?R.size(s.dims):0;if(h!==m||s&&g!==m)throw new Error(`Size of X.shape()[axis:] == ${m}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${g}`);let _=[];for(let E=0;E<a.length;++E)E<l?_.push(a[E]):_.push(1);let y=Se(m),w=["type","type"],S=[{type:12,data:p},{type:1,data:m},{type:12,data:Math.floor(m/y)},{type:1,data:t.epsilon}];s&&w.push("type");let x=r>1,b=r>2,I=E=>{let z=Ie(e[0].dataType),O=[N("x",e[0].dataType,e[0].dims,y),N("scale",n.dataType,n.dims,y)];s&&O.push(N("bias",s.dataType,s.dims,y)),O.push(H("output",e[0].dataType,u,y)),x&&O.push(H("mean_data_output",1,_)),b&&O.push(H("inv_std_output",1,_));let v=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${E.registerUniforms(v).declareVariables(...O)}
  ${E.mainStart()}
    ${E.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ba("f32",y)};
    var mean_square_vector = ${ba("f32",y)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Lt(z,y,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${yt("mean_vector",y)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${yt("mean_square_vector",y)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Lt(z,y,"x[j + offset]")};
      let f32scale = ${Lt(z,y,"scale[j]")};
      output[j + offset] = ${O[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Lt(z,y,"bias[j]")}`:""}
      );
    }

    ${x?"mean_data_output[global_idx] = mean":""};
    ${b?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},k=[{dims:u,dataType:e[0].dataType}];return x&&k.push({dims:_,dataType:1}),b&&k.push({dims:_,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${y};${r};${i}`,inputDependencies:w},getRunData:()=>({outputs:k,dispatchGroup:{x:Math.ceil(p/64)},programUniforms:S}),getShaderSource:I}},kh=(e,t)=>{zl(e.inputs),e.compute(Cl(e.inputs,t,e.outputCount))}}),Al,Th,E0=U(()=>{"use strict";re(),Qa(),Ya(),Al=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Th=e=>{Al(e.inputs);let t=Wt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(Xa(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=R.size(e.inputs[0].dims.slice(0,-2)),s=R.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let u=e.inputs[0].reshape([1,n,i]),l=e.inputs[1].reshape([1,i,r]),p=[1,n,r],m=[u,l];e.compute(Hr(m,{activation:""},t,p),{inputs:m})}else e.compute(Hr(e.inputs,{activation:""},t))}}}),Ol,Rl,Bl,Ih,Eh,z0=U(()=>{"use strict";ee(),re(),ke(),ie(),Ol=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!R.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(R.size(u)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,p=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(R.size(l)!==p)throw new Error("zeroPoints input size error.")}},Rl=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),l=R.size(u),p=e[1].dims[2]/4,m=e[0].dataType,h=Se(t.k),g=Se(p),_=Se(s),y=u.concat([a,s]),w=a>1&&s/_%2===0?2:1,S=R.size(y)/_/w,x=64,b=[],I=[l,a,n/h],k=R.convertShape(e[1].dims).slice();k.splice(-1,1,p/g),b.push(...Z(I)),b.push(...Z(k)),b.push(...Z(e[2].dims)),e.length===4&&b.push(...Z(R.convertShape(e[3].dims)));let E=[l,a,s/_];b.push(...Z(E));let z=O=>{let v=I.length,D=N("a",e[0].dataType,v,h),L=N("b",12,k.length,g),X=N("scales",e[2].dataType,e[2].dims.length),W=[D,L,X],F=e.length===4?N("zero_points",12,e[3].dims.length):void 0;F&&W.push(F);let se=E.length,A=H("output",e[0].dataType,se,_),P=Ie(e[0].dataType),J=(()=>{switch(h){case 1:return`array<${P}, 8>`;case 2:return`mat4x2<${P}>`;case 4:return`mat2x4<${P}>`;default:throw new Error(`${h}-component is not supported.`)}})(),te=Math.floor(32/t.bits),Q=Math.floor(te/8),ae=()=>{let K="";for(let G=0;G<Q;G++){let $e=G*t.bits*4,Ae=$e+t.bits;K+=`
          // reuse a data (pass ${G})
            var input_offset${G>0?G:""} = ${G===0?D.indicesToOffset(`${D.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${G>0?G:""}: ${J};
            for (var j${G>0?G:""}: u32 = 0; j${G>0?G:""} < ${8/h}; j${G>0?G:""}++) {
              a_data${G>0?G:""}[j${G>0?G:""}] = ${D.getByOffset(`input_offset${G>0?G:""}`)};
              input_offset${G>0?G:""}++;
            }
          `;for(let ve=0;ve<_*w;ve++)K+=`
            b_value = ${g===1?`b${ve}_data`:`b${ve}_data[i]`};
            ${t.bits===2?`{
              let half_word = b_value >> ${G*16}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${$e}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${Ae}u) & b_mask);`}
            b_quantized_values = ${J}(${Array.from({length:4},(Ee,me)=>`${P}(b_value_lower[${me}]), ${P}(b_value_upper[${me}])`).join(", ")});
            b_dequantized_values = ${h===1?`${J}(${Array.from({length:8},(Ee,me)=>`(b_quantized_values[${me}] - ${F?`zero_point${ve}`:"zero_point"}) * scale${ve}`).join(", ")});`:`(b_quantized_values - ${J}(${Array(8).fill(`${F?`zero_point${ve}`:"zero_point"}`).join(",")})) * scale${ve};`};
            workgroup_shared[local_id.x * ${w} + ${Math.floor(ve/_)}]${_>1?`[${ve%_}]`:""} += ${Array.from({length:8/h},(Ee,me)=>`${h===1?`a_data${G>0?G:""}[${me}] * b_dequantized_values[${me}]`:`dot(a_data${G>0?G:""}[${me}], b_dequantized_values[${me}])`}`).join(" + ")};
          `}return K},M=()=>{let K=`
            var col_index = col * ${_};
            ${F?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${P}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            `;for(let G=0;G<_*w;G++)K+=`
            let scale${G} = ${X.getByOffset("col_index * nBlocksPerCol + block")};
            ${F?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            zero_point_word = ${F.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${G} = ${P}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return K},Y=()=>{let K=`col_index = col * ${_};`;for(let G=0;G<_*w;G++)K+=`
            let b${G}_data = ${L.getByIndices(`${L.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return K+=`
            var b_value: u32;
            let b_mask: u32 = ${t.bits===2?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${J};
            var b_dequantized_values: ${J};`,K};return`
        var<workgroup> workgroup_shared: array<${A.type.value}, ${w*x}>;
        ${O.declareVariables(...W,A)}
        ${O.mainStart([x,1,1])}
          let output_indices = ${A.offsetToIndices(`(global_idx / ${x}) * ${w}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${x}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${M()}
            for (var word: u32 = 0; word < ${p}; word += ${g}) {
              ${Y()}
              for (var i: u32 = 0; i < ${g}; i++) {
                ${ae()}
                word_offset += ${te/h};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${w}) {
            var output_value: ${A.type.value} = ${A.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${x}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${w};
            }
            ${A.setByIndices(`${A.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${g};${_};${w};${x}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:m}],dispatchGroup:{x:S},programUniforms:b}),getShaderSource:z}},Bl=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),l=R.size(u),p=e[1].dims[2]/4,m=e[0].dataType,h=Se(t.k),g=Se(p),_=u.concat([a,s]),y=128,w=s%8===0?8:s%4===0?4:1,S=y/w,x=Math.floor(32/t.bits),b=S*g*x,I=b/h,k=b/t.blockSize,E=R.size(_)/w,z=[],O=[l,a,n/h],v=R.convertShape(e[1].dims).slice();v.splice(-1,1,p/g),z.push(...Z(O)),z.push(...Z(v)),z.push(...Z(e[2].dims)),e.length===4&&z.push(...Z(R.convertShape(e[3].dims)));let D=[l,a,s];z.push(...Z(D));let L=X=>{let W=O.length,F=N("a",e[0].dataType,W,h),se=N("b",12,v.length,g),A=N("scales",e[2].dataType,e[2].dims.length),P=[F,se,A],J=e.length===4?N("zero_points",12,e[3].dims.length):void 0;J&&P.push(J);let te=D.length,Q=H("output",e[0].dataType,te),ae=Ie(e[0].dataType),M=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${ae}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${ae}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${ae}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${ae}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${F.type.value}, ${I}>;
        var<workgroup> inter_results: array<array<${Q.type.value}, ${S}>, ${w}>;
        ${X.declareVariables(...P,Q)}
        ${X.mainStart([S,w,1])}
          let output_indices = ${Q.offsetToIndices(`workgroup_index * ${w}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${k} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${I};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${I}; a_offset += ${y})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${F.getByIndices(`${F.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${F.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${k} + local_id.x;
            ${J?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/t.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${t.bits}u);
            let zero_point_word = ${J.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${ae}((zero_point_word) & ${t.bits===2?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,t.bits-1)} for unsigned ${t.bits}-bit quantization.
            let zero_point = ${ae}(${Math.pow(2,t.bits-1).toFixed(1)});`}
            let scale = ${A.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${se.getByIndices(`${se.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${g}; i++) {
              let b_value = ${g===1?"b_data":"b_data[i]"};
              ${(()=>{let Y=Math.floor(x/8),K="";for(let G=0;G<Y;G++){let $e=G*t.bits*4,Ae=$e+t.bits;K+=`
              ${M()}
              {${t.bits===2?`
                let half_word = b_value >> ${G*16}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${$e}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${Ae}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${ae}>(${Array.from({length:4},(ve,Ee)=>`${ae}(b_value_lower[${Ee}]), ${ae}(b_value_upper[${Ee}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${ae}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(ve,Ee)=>`${`dot(a_data${Ee}, b_dequantized_values[${Ee}])`}`).join(" + ")};
              }
              word_offset += ${8/h};`}return K})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${w}) {
            var output_value: ${Q.type.value} = ${Q.type.value}(0);
            for (var b = 0u; b < ${S}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${Q.setByIndices(`${Q.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${g};${S};${w}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:m}],dispatchGroup:{x:E},programUniforms:z}),getShaderSource:L}},Ih=(e,t)=>{Ol(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Bl(e.inputs,t)):e.compute(Rl(e.inputs,t))},Eh=e=>he(e)}),Nl,Ml,Dl,Ul,Pl,ql,Ll,Wl,zh,C0=U(()=>{"use strict";ee(),re(),ie(),Nl=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Ml=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
            k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${j("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${j("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Dl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${j("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${j("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ul=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${j("uniforms.x_shape",a,t)})) {
                  k = i32(${j("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Pl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0)  {
                  k += i32(${j("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${j("uniforms.x_shape",a,t)})) {
                  k -= i32(${j("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},ql=(e,t,r)=>{switch(r.mode){case 0:return Ml(e,t,r.pads.length);case 1:return Dl(e,t,r.pads.length);case 2:return Ul(e,t,r.pads.length);case 3:return Pl(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Ll=(e,t)=>{let r=R.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=R.size(r),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...Z(e[0].dims,r));let u=["rank"],l=p=>{let m=H("output",e[0].dataType,r.length),h=N("x",e[0].dataType,i.length),g=h.type.value,_=ql(m,i.length,t),y=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&y.push({name:"constant_value",type:s?g:"f32"}),`
            ${p.registerUniforms(y).declareVariables(h,m)}
            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${m.offsetToIndices("global_idx")};

            var value = ${g}(0);
            ${_}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(r)/64)},programUniforms:n}),getShaderSource:l}},Wl=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let u=e[3].getBigInt64Array();for(let l=0;l<u.length;l++)n[Number(u[l])]=Number(r[l]),n[Number(u[l])+a]=Number(r[l+u.length])}else r.forEach((u,l)=>n[Number(l)]=Number(u));let s=[];return n.forEach(u=>s.push(u)),{mode:t.mode,value:i,pads:s}}else return t},zh=(e,t)=>{Nl(e.inputs);let r=Wl(e.inputs,t);e.compute(Ll(e.inputs,r),{inputs:[0]})}}),tr,Ji,ea,ta,ra,Vl,Gl,ia,aa,Ch,Ah,na,Oh,Rh,sa,Bh,Nh,Mh,Dh,A0=U(()=>{"use strict";Le(),ee(),re(),ie(),tr=e=>{if(be.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Ji=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),u=t.strides.slice(),l=n?t.dilations.slice():[],p=t.pads.slice();Vr.adjustPoolAttributes(r,a,s,u,l,p);let m=Vr.computePoolOutputShape(r,a,u,l,s,p,t.autoPad),h=Object.assign({},t);n?Object.assign(h,{kernelShape:s,strides:u,pads:p,dilations:l,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:u,pads:p,cacheKey:t.cacheKey});let g=m.slice();return g.push(g.splice(1,1)[0]),[h,i?g:m]},ea=(e,t)=>{let r=t.format==="NHWC",i=R.size(e),a=R.size(t.kernelShape),n=[{type:12,data:i},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let u=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],p=t.pads[t.pads.length/2-1],m=t.pads[t.pads.length-1],h=!!(p+m);n.push({type:12,data:u},{type:12,data:l},{type:12,data:p},{type:12,data:m}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let g=!1;if(t.kernelShape.length===2){let _=t.kernelShape[t.kernelShape.length-2],y=t.strides[t.strides.length-2],w=t.pads[t.pads.length/2-2],S=t.pads[t.pads.length-2];g=!!(w+S),n.push({type:12,data:_},{type:12,data:y},{type:12,data:w},{type:12,data:S}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,h,g]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let u=R.computeStrides(t.kernelShape);n.push({type:12,data:u},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:u.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((p,m)=>p+m);return[n,s,!!l,!1,!1]}},ta=(e,t,r,i,a,n,s,u,l,p,m,h)=>{let g=a.format==="NHWC",_=t.type.value,y=H("output",t.type.tensor,i);if(a.kernelShape.length<=2){let w="",S="",x="",b=r-(g?2:1);if(m?w=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${b}] < 0 || xIndices[${b}]
                      >= uniforms.x_shape[${b}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`:w=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`,a.kernelShape.length===2){let I=r-(g?3:2);h?S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${I}] < 0 || xIndices[${I}] >= uniforms.x_shape[${I}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                `,x=`
              }
            `}return`
            ${e.registerUniforms(l).declareVariables(t,y)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${y.offsetToIndices("global_idx")};
              var xIndices = ${y.offsetToIndices("global_idx")};

              var value = ${_}(${u});
              var pad = 0;
              ${S}
              ${w}
              ${x}
              ${s}

              output[global_idx] = value;
            }`}else{if(g)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let w=a.kernelShape.length,S=a.pads.length,x="";return p?x=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${n}
              }`:x=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${n}
            `,`
            ${e.registerUniforms(l).declareVariables(t,y)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${y.offsetToIndices("global_idx")};
              var xIndices = ${y.offsetToIndices("global_idx")};

              var offsets: array<u32, ${w}>;

              var value = ${_}(${u});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${w-1}u; j++) {
                  offsets[j] = offset / ${j("uniforms.kernelStrides","j",w)};
                  offset -= offsets[j] * ${j("uniforms.kernelStrides","j",w)};
                }
                offsets[${w-1}] = offset;

                isPad = false;
                for (var j = ${r-w}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${j("uniforms.strides",`j - ${r-w}u`,w)}
                    + offsets[j - ${r-w}u] - ${j("uniforms.pads","j - 2u",S)};
                  ${x}
              }
              ${s}

              output[global_idx] = value;
            }`}},ra=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Vl=e=>`${ra(e)};${e.countIncludePad}`,Gl=e=>`${ra(e)};${e.storageOrder};${e.dilations}`,ia=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),aa=(e,t,r,i)=>{let[a,n]=Ji(t,i,r),s=N("x",t.dataType,t.dims.length),u=s.type.value,l="value += x_val;",p="";a.countIncludePad?p+=`value /= ${u}(uniforms.kernelSize);`:p+=`value /= ${u}(i32(uniforms.kernelSize) - pad);`;let[m,h,g,_,y]=ea(n,a);m.push(...Z(t.dims,n));let w=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${y}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(n)/64)},programUniforms:m}),getShaderSource:S=>ta(S,s,t.dims.length,n.length,a,l,p,0,h,g,_,y)}},Ch=e=>{let t=e.count_include_pad!==0,r=ia(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:Vl(i)}},Ah=(e,t)=>{tr(e.inputs),e.compute(aa("AveragePool",e.inputs[0],!1,t))},na={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Oh=e=>{let t=e.format;return{format:t,...na,cacheKey:t}},Rh=(e,t)=>{tr(e.inputs),e.compute(aa("GlobalAveragePool",e.inputs[0],!0,t))},sa=(e,t,r,i)=>{let[a,n]=Ji(t,i,r),s=`
      value = max(x_val, value);
    `,u="",l=N("x",t.dataType,t.dims.length),p=["rank"],[m,h,g,_,y]=ea(n,a);return m.push(...Z(t.dims,n)),{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${y}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(n)/64)},programUniforms:m}),getShaderSource:w=>ta(w,l,t.dims.length,n.length,a,s,u,t.dataType===10?-65504:-1e5,h,g,_,y)}},Bh=(e,t)=>{tr(e.inputs),e.compute(sa("MaxPool",e.inputs[0],!1,t))},Nh=e=>{let t=e.storage_order,r=e.dilations,i=ia(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:Gl(a)}},Mh=e=>{let t=e.format;return{format:t,...na,cacheKey:t}},Dh=(e,t)=>{tr(e.inputs),e.compute(sa("GlobalMaxPool",e.inputs[0],!0,t))}}),Hl,Fl,Uh,Ph,O0=U(()=>{"use strict";ee(),re(),ke(),ie(),Hl=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Fl=(e,t)=>{let r=R.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,n=e[0].dims,s=e[1].dataType,u=R.size(n),l=i===3||i===2,p=l?[Math.ceil(R.size(e[0].dims)/4)]:e[0].dims,m=e[1].dims,h=e.length>2?e[2]:void 0,g=h?l?[Math.ceil(R.size(h.dims)/4)]:h.dims:void 0,_=m.length===0||m.length===1&&m[0]===1,y=_===!1&&m.length===1,w=Se(u),S=_&&(!l||w===4),x=S?w:1,b=S&&!l?w:1,I=N("input",l?12:i,p.length,b),k=N("scale",s,m.length),E=h?N("zero_point",l?12:i,g.length):void 0,z=H("output",s,n.length,x),O=[I,k];E&&O.push(E);let v=[p,m];h&&v.push(g);let D=[{type:12,data:u/x},{type:12,data:r},{type:12,data:t.blockSize},...Z(...v,n)],L=X=>{let W=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${X.registerUniforms(W).declareVariables(...O,z)}
      ${X.mainStart()}
          ${X.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${I.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${x===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${I.getByOffset("global_idx")};`};

          // Set scale input
          ${_?`let scale_value= ${k.getByOffset("0")}`:y?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${k.getByOffset("scale_index")};`:`
            var scale_indices: ${k.type.indices} = output_indices;
            let index = ${k.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${k.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${k.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${E?_?l?`
                let zero_point_input = ${E.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${E.getByOffset("0")}`:y?l?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${E.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${E.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${k.indicesToOffset("scale_indices")};
                let zero_point_input = ${E.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${E.getByIndices("scale_indices")};`:`let zero_point_value = ${l?a?"i32":"u32":I.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:E?["rank","rank","rank"]:["rank","rank"]},getShaderSource:L,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(u/x/64),y:1,z:1},programUniforms:D})}},Uh=(e,t)=>{Hl(e.inputs,t),e.compute(Fl(e.inputs,t))},Ph=e=>he({axis:e.axis,blockSize:e.blockSize})}),jl,Kl,qh,R0=U(()=>{"use strict";Le(),ee(),ie(),jl=(e,t,r)=>{let i=e===t,a=e<t&&r<0,n=e>t&&r>0;if(i||a||n)throw new Error("Range these inputs' contents are invalid.")},Kl=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),n=[a],s=a,u=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...Z(n)],l=p=>{let m=H("output",i,n.length),h=m.type.value,g=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${p.registerUniforms(g).declareVariables(m)}
        ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:n,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:u})}},qh=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),be.webgpu.validateInputContent&&jl(t,r,i),e.compute(Kl(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Zl,Xl,Lh,Wh,B0=U(()=>{"use strict";ee(),re(),ke(),ie(),Zl=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,n=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${n}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${n}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${n}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Xl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,n=1,s=Math.ceil(R.sizeToDimension(i,i.length-1)/n),u=i[i.length-1],l=R.sizeFromDimension(r,u),p=[{type:12,data:s},{type:12,data:u},{type:12,data:l},...Z(e[1].dims,e[2].dims,a)],m=h=>{let g=N("indices",e[1].dataType,e[1].dims.length),_=N("updates",e[2].dataType,e[2].dims.length,n),y=t.reduction!=="none"&&t.reduction!==""?gp("output",e[0].dataType,a.length):H("output",e[0].dataType,a.length,n);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(g,_,y)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${Zl(t.reduction,"output[data_offset + i]","value",y.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:p}),getShaderSource:m}},Lh=e=>he({reduction:e.reduction}),Wh=(e,t)=>{e.compute(Xl(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Ql,Yl,Jl,oa,ed,td,rd,id,ad,nd,sd,od,ua,ud,ld,dd,pd,cd,Vh,Gh,N0=U(()=>{"use strict";ee(),re(),ke(),ie(),Ql=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Yl=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,n)=>i[a]=e[n]),i},Jl=(e,t,r,i,a,n)=>{let[s,u,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],p=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(m=>n.push(m));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0){if(e[u].getFloat32Array().forEach(m=>i.push(m)),i.length!==0&&i.length!==p&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Ql(i,t),t.axes.length>0&&Yl(i,t.axes,p).forEach((m,h)=>i[h]=m)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(m=>a.push(Number(m))),a.length!==0&&a.length!==p&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>p)throw new Error("Resize requires only of scales or sizes to be specified")},oa=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,ed=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${oa("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${oa("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",td=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",rd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((n,s)=>{i[n]=a[s],i[s+r]=a[t.length+s]}),i):a},id=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(n=>a.push(n)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((n,s)=>a[n]=r[s])}else r.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},ad=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(n=>t[n]=i),r.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(i,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},nd=(e,t,r,i,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${j("uniforms.scales","i",i)};
        var roi_low = ${j("uniforms.roi","i",a)};
        var roi_hi = ${j("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${j("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,sd=(e,t,r,i,a,n,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${j("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${j("uniforms.roi","i",n)};
          var roi_hi = ${j("uniforms.roi",`i + ${r.length}`,n)};
          var input_shape_i = ${j("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,od=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${j("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,ua=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",ud=(e,t,r,i,a)=>{let[n,s,u,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${r[u]} - 1))`)};
      ${ua(e,l,n,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${p} = originalIndices[${s}];
      var col:${p} = originalIndices[${u}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[u]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${n}])`:"0"};
      var x11: ${p} = getInputValue(batch, channel, row1, col1);
      var x12: ${p} = getInputValue(batch, channel, row1, col2);
      var x21: ${p} = getInputValue(batch, channel, row2, col1);
      var x22: ${p} = getInputValue(batch, channel, row2, col2);
      var dx1: ${p} = abs(row - ${p}(row1));
      var dx2: ${p} = abs(${p}(row2) - row);
      var dy1: ${p} = abs(col - ${p}(col1));
      var dy2: ${p} = abs(${p}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},ld=(e,t,r,i,a,n,s,u,l,p)=>{let m=r.length===2,h=!0,[g,_]=m?[0,1]:h?[2,3]:[1,2],y=e.type.value,w=S=>{let x=S===g?"row":"col";return`
      fn ${x}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${y} {
        var output_index = ${t.indicesGet("output_indices",S)};
        var originalIdx: ${y} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[S]},
        ${i[S]}, ${r[S]}, ${n[S]}, ${n[S]} + ${r.length});
        var fractOriginalIdx: ${y} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${u} && (originalIdx < 0 || originalIdx > (${r[S]} - 1))) {
          return ${l};
        }
        var data: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${x}: ${y} = originalIdx + ${y}(i);
          if (${x} < 0 || ${x} >= ${r[S]}) {
            ${p?`coefs[i + 1] = 0.0;
                        continue;`:u?`return ${l};`:`${x} = max(0, min(${x}, ${r[S]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",S,`u32(${x})`)};
          data[i + 1] = ${S===g?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${w(g)};
    ${w(_)};
  fn getCubicInterpolationCoefs(s: ${y}) -> array<${y}, 4> {
    var absS = abs(s);
    var coeffs: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${y} = 1.0 - absS;
    var twoMinusAbsS: ${y} = 2.0 - absS;
    var onePlusAbsS: ${y} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${y}, 4>, coefs: array<${y}, 4>) -> ${y} {
    var coefsSum: ${y} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${y} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},dd=(e,t,r,i,a)=>{let[n,s,u,l,p]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],m=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${m} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${r[u]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${ua(e,p,n,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${m} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${m} = originalIndices[${s}];
      var height:${m} = originalIndices[${u}];
      var width:${m} = originalIndices[${l}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[u]} - 1) || width < 0 || (width > ${r[l]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[u]} - 1));
      width = max(0, min(width, ${r[l]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${p}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${n}])`:"0"};

      var x111: ${m} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${m} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${m} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${m} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${m} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${m} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${m} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${m} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${m} = abs(depth - ${m}(depth1));
      var dx2: ${m} = abs(${m}(depth2) - depth);
      var dy1: ${m} = abs(height - ${m}(height1));
      var dy2: ${m} = abs(${m}(height2) - height);
      var dz1: ${m} = abs(width - ${m}(width1));
      var dz2: ${m} = abs(${m}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},pd=(e,t,r,i,a,n)=>{let s=e.dims,u=rd(n,t.axes,s.length),l=id(s,i,a,t.axes),p=i.slice();i.length===0&&(p=s.map((b,I)=>b===0?1:l[I]/b),t.keepAspectRatioPolicy!=="stretch"&&(l=ad(s,p,t)));let m=H("output",e.dataType,l.length),h=N("input",e.dataType,s.length),g=R.size(l),_=s.length===l.length&&s.every((b,I)=>b===l[I]),y=t.coordinateTransformMode==="tf_crop_and_resize",w=t.extrapolationValue,S=h.type.value,x=b=>`
      ${_?"":`
      ${ed(t.coordinateTransformMode,S)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${od(h,s)};
              ${td(t.nearestMode,r,S)};
              ${sd(h,m,s,l,p.length,u.length,y)};
              `;case"linear":return`
              ${nd(m,s,l,p.length,u.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${ud(h,m,s,y,w)}`;if(s.length===3||s.length===5)return`${dd(h,m,s,y,w)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${ld(h,m,s,l,p,u,t.cubicCoeffA,y,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${b.registerUniform("output_size","u32").registerUniform("scales","f32",p.length).registerUniform("roi","f32",u.length).declareVariables(h,m)}
      ${b.mainStart()}
        ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${_?"output[global_idx] = input[global_idx];":`
        let output_indices = ${m.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${p.length>0?t.mode==="cubic"?p:p.length:""}|${a.length>0?a:""}|${u.length>0?u:""}|${_}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},{type:1,data:p},{type:1,data:u},...Z(s,l)]})}},cd=e=>{let t=e.customDataBuffer;return new Uint32Array(t.buffer,t.byteOffset,1)[0]},Vh=(e,t)=>{let r=[],i=[],a=[],n=cd(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Jl(e.inputs,t,n,r,i,a),e.compute(pd(e.inputs[0],t,n,r,i,a),{inputs:[0]})},Gh=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,u=e.keepAspectRatioPolicy,l=e.mode,p=e.nearestMode===""?"simple":e.nearestMode;return he({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:u,mode:l,nearestMode:p})}}),hd,fd,Hh,M0=U(()=>{"use strict";ee(),re(),ie(),hd=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},fd=(e,t,r,i)=>{let a=t.simplified,n=e[0].dims,s=R.size(n),u=n,l=s,p=n.slice(-1)[0],m=i?n.slice(0,-1).concat(1):[],h=!a&&e.length>3,g=e.length>4,_=i&&r>1,y=i&&r>2,w=r>3,S=64,x=Se(p),b=[{type:12,data:l},{type:12,data:x},{type:12,data:p},{type:1,data:t.epsilon}],I=E=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],O=[N("x",e[0].dataType,e[0].dims,x),N("skip",e[1].dataType,e[1].dims,x),N("gamma",e[2].dataType,e[2].dims,x)];h&&O.push(N("beta",e[3].dataType,e[3].dims,x)),g&&O.push(N("bias",e[4].dataType,e[4].dims,x)),O.push(H("output",e[0].dataType,u,x)),_&&O.push(H("mean_output",1,m)),y&&O.push(H("inv_std_output",1,m)),w&&O.push(H("input_skip_bias_sum",e[0].dataType,u,x));let v=Ie(e[0].dataType),D=Ie(1,x);return`

      ${E.registerUniforms(z).declareVariables(...O)}
      var<workgroup> sum_shared : array<${D}, ${S}>;
      var<workgroup> sum_squared_shared : array<${D}, ${S}>;

      ${E.mainStart([S,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${S};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${S};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${S-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${g?"bias[offset1d + i]":v+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${w?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Lt(v,x,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${S};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${yt("sum",x)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${yt("square_sum",x)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${_?"mean_output[global_idx] = mean;":""}
        ${y?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${v}(mean)`}) *
            ${v}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},k=[{dims:u,dataType:e[0].dataType}];return r>1&&k.push({dims:m,dataType:1}),r>2&&k.push({dims:m,dataType:1}),r>3&&k.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${x};${_};${y};${w}`,inputDependencies:e.map((E,z)=>"type")},getShaderSource:I,getRunData:()=>({outputs:k,dispatchGroup:{x:Math.ceil(l/p)},programUniforms:b})}},Hh=(e,t)=>{hd(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(fd(e.inputs,t,e.outputCount,!1),{outputs:r})}}),md,rr,gd,la,yd,_d,Fh,jh,D0=U(()=>{"use strict";ee(),re(),ke(),ie(),md=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},rr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},gd=(e,t)=>{if(e.length>1){let r=rr(e,1),i=rr(e,2),a=rr(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),he({starts:r,ends:i,axes:a})}else return t},la=(e,t,r,i,a)=>{let n=e;return e<0&&(n+=r[i[t]]),a[t]<0?Math.max(0,Math.min(n,r[i[t]]-1)):Math.max(0,Math.min(n,r[i[t]]))},yd=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${j("uniforms.input_shape","i",r.length)};
            let steps_i = ${j("uniforms.steps","i",r.length)};
            let signs_i = ${j("uniforms.signs","i",r.length)};
            let starts_i = ${j("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,_d=(e,t)=>{let r=e[0].dims,i=R.size(r),a=t.axes.length>0?R.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],n=rr(e,4);n.forEach(x=>x!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((x,b)=>la(x,b,r,a,n)),u=t.ends.map((x,b)=>la(x,b,r,a,n));if(a.length!==s.length||a.length!==u.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let x=0;x<r.length;++x)a.includes(x)||(s.splice(x,0,0),u.splice(x,0,r[x]),n.splice(x,0,1));let l=n.map(x=>Math.sign(x));n.forEach((x,b,I)=>{if(x<0){let k=(u[b]-s[b])/x,E=s[b],z=E+k*n[b];s[b]=z,u[b]=E,I[b]=-x}});let p=r.slice(0);a.forEach((x,b)=>{p[x]=Math.ceil((u[x]-s[x])/n[x])});let m={dims:p,dataType:e[0].dataType},h=H("output",e[0].dataType,p.length),g=N("input",e[0].dataType,e[0].dims.length),_=R.size(p),y=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:n.length}],w=[{type:12,data:_},{type:12,data:s},{type:6,data:l},{type:12,data:n},...Z(e[0].dims,p)],S=x=>`
      ${x.registerUniforms(y).declareVariables(g,h)}
        ${yd(g,h,r)}
        ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",g.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:S,getRunData:()=>({outputs:[m],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:w})}},Fh=(e,t)=>{md(e.inputs,t);let r=gd(e.inputs,t);e.compute(_d(e.inputs,r),{inputs:[0]})},jh=e=>{let t=e.starts,r=e.ends,i=e.axes;return he({starts:t,ends:r,axes:i})}}),bd,$d,Kh,Zh,U0=U(()=>{"use strict";ee(),re(),ke(),_t(),ie(),bd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},$d=(e,t)=>{let r=e.inputs[0],i=r.dims,a=R.size(i),n=i.length,s=R.normalizeAxis(t.axis,n),u=s<i.length-1,l,p=[];u?(p=Array.from({length:n},(O,v)=>v),p[s]=n-1,p[n-1]=s,l=e.compute(De(r,p),{inputs:[r],outputs:[-1]})[0]):l=r;let m=l.dims,h=m[n-1],g=a/h,_=Se(h),y=h/_,w=64;g===1&&(w=256);let S=(O,v)=>v===4?`max(max(${O}.x, ${O}.y), max(${O}.z, ${O}.w))`:v===2?`max(${O}.x, ${O}.y)`:v===3?`max(max(${O}.x, ${O}.y), ${O}.z)`:O,x=N("x",l.dataType,l.dims,_),b=H("result",l.dataType,l.dims,_),I=x.type.value,k=Ie(l.dataType)==="f32"?`var threadMax = ${I}(-3.4028234663852886e+38f);`:`var threadMax = ${I}(-65504.0h);`,E=O=>`
      var<workgroup> rowMaxShared : ${I};
      var<workgroup> rowSumShared : ${I};
      var<workgroup> threadShared : array<${I}, ${w}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${I} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${I}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${O.registerUniform("packedCols","i32").declareVariables(x,b)}
      ${O.mainStart(w)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${w};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${k}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${I}(${S("threadShared[0]",_)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${I}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${I}(${yt("threadShared[0]",_)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${I}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${_};${w}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:m,dataType:l.dataType}],dispatchGroup:{x:g},programUniforms:[{type:6,data:y}]}),getShaderSource:E},{inputs:[l],outputs:[u?-1:0]})[0];u&&e.compute(De(z,p),{inputs:[z]})},Kh=(e,t)=>{bd(e.inputs),$d(e,t)},Zh=e=>he({axis:e.axis})}),da,wd,vd,xd,Xh,P0=U(()=>{"use strict";ee(),re(),ie(),da=e=>Array.from(e.getBigInt64Array(),Number),wd=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(da(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},vd=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},xd=(e,t)=>{let r=e[0].dims,i=t??da(e[1]),a=vd(r,i),n=R.size(a),s=e[0].dataType,u=N("input",s,r.length),l=H("output",s,a.length),p=m=>`
      const inputShape = ${u.indices(...r)};
      ${m.registerUniform("output_size","u32").declareVariables(u,l)}
      ${m.mainStart()}
      ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${l.offsetToIndices("global_idx")};
      var input_indices: ${u.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${u.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${l.indicesGet("output_indices","i")}  % input_dim_i;

        ${u.indicesSet("input_indices","i","input_dim_value")}
      }
      ${l.setByOffset("global_idx",u.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...Z(e[0].dims,a)]}),getShaderSource:p}},Xh=e=>{wd(e.inputs),e.compute(xd(e.inputs),{inputs:[0]})}}),Sd,kd,Qh,q0=U(()=>{"use strict";ee(),re(),ie(),Sd=(e,t,r,i,a)=>{let n=H("output_data",a,r.length,4),s=N("a_data",t[1].dataType,t[1].dims.length,4),u=N("b_data",t[2].dataType,t[2].dims.length,4),l=N("c_data",t[0].dataType,t[0].dims.length,4),p,m=(h,g,_)=>`select(${g}, ${h}, ${_})`;if(!i)p=n.setByOffset("global_idx",m(s.getByOffset("global_idx"),u.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let h=(g,_,y="")=>{let w=`a_data[index_a${_}][component_a${_}]`,S=`b_data[index_b${_}][component_b${_}]`,x=`bool(c_data[index_c${_}] & (0xffu << (component_c${_} * 8)))`;return`
            let output_indices${_} = ${n.offsetToIndices(`global_idx * 4u + ${_}u`)};
            let offset_a${_} = ${s.broadcastedIndicesToOffset(`output_indices${_}`,n)};
            let offset_b${_} = ${u.broadcastedIndicesToOffset(`output_indices${_}`,n)};
            let offset_c${_} = ${l.broadcastedIndicesToOffset(`output_indices${_}`,n)};
            let index_a${_} = offset_a${_} / 4u;
            let index_b${_} = offset_b${_} / 4u;
            let index_c${_} = offset_c${_} / 4u;
            let component_a${_} = offset_a${_} % 4u;
            let component_b${_} = offset_b${_} % 4u;
            let component_c${_} = offset_c${_} % 4u;
            ${g}[${_}] = ${y}(${m(w,S,x)});
          `};a===9?p=`
            var data = vec4<u32>(0);
            ${h("data",0,"u32")}
            ${h("data",1,"u32")}
            ${h("data",2,"u32")}
            ${h("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:p=`
            ${h("output_data[global_idx]",0)}
            ${h("output_data[global_idx]",1)}
            ${h("output_data[global_idx]",2)}
            ${h("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(l,s,u,n)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${p}
      }`},kd=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,n=!(R.areEqual(t,r)&&R.areEqual(r,i)),s=t,u=R.size(t);if(n){let p=Wt.calcShape(Wt.calcShape(t,r,!1),i,!1);if(!p)throw new Error("Can't perform where op on the given tensors");s=p,u=R.size(s)}let l=Math.ceil(u/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:p=>Sd(p,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64/4)},programUniforms:[{type:12,data:l},...Z(i,t,r,s)]})}},Qh=e=>{e.compute(kd(e.inputs))}}),Yh,L0=U(()=>{"use strict";t0(),Fa(),r0(),i0(),a0(),n0(),s0(),p0(),h0(),f0(),m0(),g0(),y0(),_0(),b0(),$0(),w0(),v0(),x0(),S0(),k0(),T0(),I0(),E0(),z0(),yh(),C0(),A0(),O0(),R0(),B0(),Ha(),N0(),vh(),M0(),D0(),U0(),$h(),P0(),_t(),ja(),q0(),Yh=new Map([["Abs",[Hp]],["Acos",[Fp]],["Acosh",[jp]],["Add",[Ic]],["ArgMax",[Lp,wa]],["ArgMin",[qp,wa]],["Asin",[Kp]],["Asinh",[Zp]],["Atan",[Xp]],["Atanh",[Qp]],["Attention",[Wp]],["AveragePool",[Ah,Ch]],["BatchNormalization",[Vp]],["BiasAdd",[Gp]],["BiasSplitGelu",[Tc]],["Cast",[Jp,Yp]],["Ceil",[tc]],["Clip",[ec]],["Concat",[Dc,Uc]],["Conv",[Ia,Ta]],["ConvTranspose",[Kc,jc]],["Cos",[rc]],["Cosh",[ic]],["CumSum",[Zc,Xc]],["DepthToSpace",[Qc,Yc]],["DequantizeLinear",[Uh,Ph]],["Div",[Ec]],["Einsum",[Jc,eh]],["Elu",[ac,or]],["Equal",[zc]],["Erf",[nc]],["Exp",[sc]],["Expand",[th]],["FastGelu",[rh]],["Floor",[oc]],["FusedConv",[Ia,Ta]],["Gather",[ah,ih]],["GatherElements",[dh,lh]],["GatherBlockQuantized",[oh,uh]],["GatherND",[nh,sh]],["Gelu",[uc]],["Gemm",[ch,ph]],["GlobalAveragePool",[Rh,Oh]],["GlobalMaxPool",[Dh,Mh]],["Greater",[Rc]],["GreaterOrEqual",[Nc]],["GridSample",[hh,fh]],["GroupQueryAttention",[xh]],["HardSigmoid",[gc,mc]],["InstanceNormalization",[Sh]],["LayerNormalization",[kh]],["LeakyRelu",[lc,or]],["Less",[Bc]],["LessOrEqual",[Mc]],["Log",[Sc]],["MatMul",[Th]],["MatMulNBits",[Ih,Eh]],["MaxPool",[Bh,Nh]],["Mul",[Cc]],["MultiHeadAttention",[gh,mh]],["Neg",[pc]],["Not",[dc]],["Pad",[zh]],["Pow",[Ac]],["QuickGelu",[kc,or]],["Range",[qh]],["Reciprocal",[cc]],["ReduceMin",[Np]],["ReduceMean",[Cp]],["ReduceMax",[Bp]],["ReduceSum",[Dp]],["ReduceProd",[Mp]],["ReduceL1",[Ap]],["ReduceL2",[Op]],["ReduceLogSum",[Pp]],["ReduceLogSumExp",[Rp]],["ReduceSumSquare",[Up]],["Relu",[hc]],["Resize",[Vh,Gh]],["RotaryEmbedding",[wh]],["ScatterND",[Wh,Lh]],["Sigmoid",[fc]],["Sin",[yc]],["Sinh",[_c]],["Slice",[Fh,jh]],["SkipLayerNormalization",[Hh]],["Split",[_h,bh]],["Sqrt",[bc]],["Softmax",[Kh,Zh]],["Sub",[Oc]],["Tan",[$c]],["Tanh",[wc]],["ThresholdedRelu",[xc,or]],["Tile",[Xh]],["Transpose",[_p,bp]],["Where",[Qh]]])}),Jh,W0=U(()=>{"use strict";Le(),nt(),ie(),Jh=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){Xe(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let p of t)u.push({binding:u.length,resource:{buffer:p.buffer}});for(let p of r)u.push({binding:u.length,resource:{buffer:p.buffer}});a&&u.push({binding:u.length,resource:a});let l=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:u,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let p={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(p)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),qe(e.programInfo.name)}dispose(){}build(e,t){Xe(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(p=>{r.features.has(p.feature)&&i.push(`enable ${p.extension};`)});let a=yp(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${i.join(`
`)}
${a.additionalImplementations}
${n}`,u=r.createShaderModule({code:s,label:e.name});de("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:u,entryPoint:"main"},layout:"auto",label:e.name});return qe(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let n=t*r*i,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),ef={};Gt(ef,{WebGpuBackend:()=>tf});var Td,Id,Ed,tf,V0=U(()=>{"use strict";Le(),ee(),nt(),cp(),Jg(),L0(),W0(),Td=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let n=e[i].dims.length;r.push(`${a};${n}`);break}case"dims":{let n=e[i].dims.join(",");r.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Id=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Td(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Ed=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},tf=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=u=>t.features.has(u)&&r.push(u)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i);let n=t,s=t.info??(typeof n.requestAdapterInfo=="function"?await n.requestAdapterInfo():void 0);this.adapterInfo=new Ed(s),this.gpuDataManager=mp(this),this.programManager=new Jh(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,La(e.logLevel,!!e.debug),this.device.onuncapturederror=u=>{u.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${u.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Xe(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let a=r[i],n=a.kernelId,s=this.kernels.get(n),u=s.kernelType,l=s.kernelName,p=a.programName,m=a.inputTensorViews,h=a.outputTensorViews,g=t[i*2],_=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=g);let y=Number(g-this.queryTimeBase),w=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(y)||!Number.isSafeInteger(w))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:m.map(S=>({dims:S.dims,dataType:at(S.dataType)})),outputsMetadata:h.map(S=>({dims:S.dims,dataType:at(S.dataType)})),kernelId:n,kernelType:u,kernelName:l,programName:p,startTime:y,endTime:w});else{let S="";m.forEach((b,I)=>{S+=`input[${I}]: [${b.dims}] | ${at(b.dataType)}, `});let x="";h.forEach((b,I)=>{x+=`output[${I}]: [${b.dims}] | ${at(b.dataType)}, `}),console.log(`[profiling] kernel "${n}|${u}|${l}|${p}" ${S}${x}start time: ${y} ns, execution time: ${w-y} ns`)}pr("GPU",`${p}::${g}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),qe()}run(e,t,r,i,a,n){Xe(e.name);let s=[];for(let b=0;b<t.length;++b){let I=t[b].data;if(I===0)continue;let k=this.gpuDataManager.get(I);if(!k)throw new Error(`no GPU data for input: ${I}`);s.push(k)}let{outputs:u,dispatchGroup:l,programUniforms:p}=e.getRunData(t),m=r.length===0?u.map((b,I)=>I):r;if(m.length!==u.length)throw new Error(`Output size ${m.length} must be equal to ${u.length}.`);let h=[],g=[];for(let b=0;b<u.length;++b){if(!Number.isInteger(m[b])||m[b]<-3||m[b]>=n)throw new Error(`Invalid output index: ${m[b]}`);if(m[b]===-3)continue;let I=m[b]===-1,k=m[b]===-2,E=I||k?a(u[b].dataType,u[b].dims):i(m[b],u[b].dataType,u[b].dims);if(h.push(E),E.data===0)continue;let z=this.gpuDataManager.get(E.data);if(!z)throw new Error(`no GPU data for output: ${E.data}`);if(I&&this.temporaryData.push(z),k){let O=this.kernelPersistentData.get(this.currentKernelId);O||(O=[],this.kernelPersistentData.set(this.currentKernelId,O)),O.push(z)}g.push(z)}if(s.length!==t.length||g.length!==h.length){if(g.length===0)return qe(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let _;if(p){let b=0,I=[];p.forEach(O=>{let v=typeof O.data=="number"?[O.data]:O.data;if(v.length===0)return;let D=O.type===10?2:4,L,X;O.type===10?(X=v.length>4?16:v.length>2?8:v.length*D,L=v.length>4?16:D*v.length):(X=v.length<=2?v.length*D:16,L=16),b=Math.ceil(b/X)*X,I.push(b);let W=O.type===10?8:4;b+=v.length>4?Math.ceil(v.length/W)*L:v.length*D});let k=16;b=Math.ceil(b/k)*k;let E=new ArrayBuffer(b);p.forEach((O,v)=>{let D=I[v],L=typeof O.data=="number"?[O.data]:O.data;if(O.type===6)new Int32Array(E,D,L.length).set(L);else if(O.type===12)new Uint32Array(E,D,L.length).set(L);else if(O.type===10)new Uint16Array(E,D,L.length).set(L);else if(O.type===1)new Float32Array(E,D,L.length).set(L);else throw new Error(`Unsupported uniform type: ${at(O.type)}`)});let z=this.gpuDataManager.create(b,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,E,0,b),this.gpuDataManager.release(z.id),_={offset:0,size:b,buffer:z.buffer}}let y=this.programManager.normalizeDispatchGroupSize(l),w=y[1]===1&&y[2]===1,S=Id(e,t,w),x=this.programManager.getArtifact(S);if(x||(x=this.programManager.build(e,y),this.programManager.setArtifact(S,x),de("info",()=>`[artifact] key: ${S}, programName: ${e.name}`)),p&&x.uniformVariablesInfo){if(p.length!==x.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${x.uniformVariablesInfo.length}, got ${p.length} in program "${x.programInfo.name}".`);for(let b=0;b<p.length;b++){let I=p[b],k=I.type,E=typeof I.data=="number"?1:I.data.length,[z,O]=x.uniformVariablesInfo[b];if(k!==z||E!==O)throw new Error(`Uniform variable ${b} mismatch: expect type ${z} with size ${O}, got type ${k} with size ${E} in program "${x.programInfo.name}".`)}}if(de("info",()=>`[ProgramManager] run "${e.name}" (key=${S}) with ${y[0]}x${y[1]}x${y[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let b={kernelId:this.currentKernelId,programName:x.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(b),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(b)}return this.programManager.run(x,s,g,y,_),qe(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=Yh.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,n=i.kernelName,s=i.kernelEntry,u=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),de("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,u[1]),0}catch(p){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${p}`)),1}finally{l&&r.push(this.device.popErrorScope().then(p=>p?`GPU validation error for kernel "[${a}] ${n}": ${p.message}`:null));for(let p of this.temporaryData)this.gpuDataManager.release(p.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,n);return a.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await _a(this,e,t);return Wa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){de("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){de("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){de("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),n=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),rf={};Gt(rf,{init:()=>af});var Mr,zd,af,G0=U(()=>{"use strict";ee(),nt(),re(),Yg(),Mr=class nf{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(R.size(t)!==R.size(this.dims))throw new Error("Invalid new shape");return new nf(this.module,this.dataType,this.data,t)}},zd=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,n=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,n));let s=Number(e.getValue(i*a++,n));this.outputCount=Number(e.getValue(i*a++,n)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,n));let u=[];for(let l=0;l<s;l++){let p=Number(e.getValue(i*a++,n)),m=Number(e.getValue(i*a++,"*")),h=Number(e.getValue(i*a++,n)),g=[];for(let _=0;_<h;_++)g.push(Number(e.getValue(i*a++,n)));u.push(new Mr(e,p,m,g))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],a=(s,u,l)=>new Mr(this.module,u,this.output(s,l),l),n=(s,u)=>{let l=At(s,u);if(!l)throw new Error(`Unsupported data type: ${s}`);let p=l>0?this.backend.gpuDataManager.create(l).id:0;return new Mr(this.module,s,p,u)};return this.backend.run(e,r,i,a,n,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*i);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+i*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},af=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(V0(),dr(ef)).WebGpuBackend,s=new n;await s.initialize(r,i),a("webgpu",[s,u=>s.alloc(Number(u)),u=>s.free(u),(u,l,p,m=!1)=>{if(m)de("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(u)}, dst=${Number(l)}, size=${Number(p)}`),s.memcpy(Number(u),Number(l));else{de("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(u)}, gpuDataId=${Number(l)}, size=${Number(p)}`);let h=t.HEAPU8.subarray(Number(u>>>0),Number(u>>>0)+Number(p));s.upload(Number(l),h)}},async(u,l,p)=>{de("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${u}, dataOffset=${l}, size=${p}`),await s.download(Number(u),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+p)>>>0))},(u,l,p)=>s.createKernel(u,Number(l),p,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),u=>s.releaseKernel(u),(u,l,p,m)=>{de("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${p}, kernel=${u}, contextDataOffset=${l}`);let h=new zd(t,s,Number(l));return s.computeKernel(Number(u),h,m)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new fp(r);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,u,l,p,m)=>n.ensureTensor(s,u,l,p,m),(s,u)=>{n.uploadTensor(s,u)},async(s,u)=>n.downloadTensor(s,u),(s,u)=>n.registerMLContext(s,u),!!r.trace])}}}),Cd,Ja,en,ht,Ad,pa,jr,tn,rn,ca,an,nn,sn,sf=U(()=>{"use strict";Le(),Zg(),Xg(),ee(),Mt(),Da(),up(),Cd=(e,t)=>{ye()._OrtInit(e,t)!==0&&fe("Can't initialize onnxruntime.")},Ja=async e=>{Cd(e.wasm.numThreads,Wr(e.logLevel))},en=async(e,t)=>{ye().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let a=e.webgpu.forceFallbackAdapter;if(a!==void 0&&typeof a!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${a}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:a}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(G0(),dr(rf)).init;t==="webgpu"&&await i("webgpu",ye(),e,r),t==="webnn"&&await i("webnn",ye(),e)}},ht=new Map,Ad=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&fe("Can't get session input/output count.");let n=i===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+i,n))]}finally{t.stackRestore(r)}},pa=(e,t)=>{let r=ye(),i=r.stackSave(),a=0;try{let n=r.PTR_SIZE,s=r.stackAlloc(2*n);r._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&fe("Can't get session input/output metadata.");let u=Number(r.getValue(s,"*"));a=Number(r.getValue(s+n,"*"));let l=r.HEAP32[a/4];if(l===0)return[u,0];let p=r.HEAPU32[a/4+1],m=[];for(let h=0;h<p;h++){let g=Number(r.getValue(a+8+h*n,"*"));m.push(g!==0?r.UTF8ToString(g):Number(r.getValue(a+8+(h+p)*n,"*")))}return[u,l,m]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},jr=e=>{let t=ye(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},tn=async(e,t)=>{let r,i,a=ye();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=jr(e);let n=0,s=0,u=0,l=[],p=[],m=[];try{if([s,l]=await op(t),t?.externalData&&a.mountExternalData){let k=[];for(let E of t.externalData){let z=typeof E=="string"?E:E.path;k.push(qa(typeof E=="string"?E:E.data).then(O=>{a.mountExternalData(z,O)}))}await Promise.all(k)}for(let k of t?.executionProviders??[])if((typeof k=="string"?k:k.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof k!="string"){let E=k,z=E?.context,O=E?.gpuDevice,v=E?.deviceType,D=E?.powerPreference;z?a.currentContext=z:O?a.currentContext=await a.webnnCreateMLContext(O):a.currentContext=await a.webnnCreateMLContext({deviceType:v,powerPreference:D})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(r,i,s),a.webgpuOnCreateSession?.(n),n===0&&fe("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[h,g]=Ad(n),_=!!t?.enableGraphCapture,y=[],w=[],S=[],x=[],b=[];for(let k=0;k<h;k++){let[E,z,O]=pa(n,k);E===0&&fe("Can't get an input name."),p.push(E);let v=a.UTF8ToString(E);y.push(v),S.push(z===0?{name:v,isTensor:!1}:{name:v,isTensor:!0,type:at(z),shape:O})}for(let k=0;k<g;k++){let[E,z,O]=pa(n,k+h);E===0&&fe("Can't get an output name."),m.push(E);let v=a.UTF8ToString(E);w.push(v),x.push(z===0?{name:v,isTensor:!1}:{name:v,isTensor:!0,type:at(z),shape:O});{if(_&&t?.preferredOutputLocation===void 0){b.push("gpu-buffer");continue}let D=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[v]??"cpu",L=a.webnnIsGraphOutput;if(D==="cpu"&&L&&L(n,v)){b.push("ml-tensor-cpu-output");continue}if(D!=="cpu"&&D!=="cpu-pinned"&&D!=="gpu-buffer"&&D!=="ml-tensor")throw new Error(`Not supported preferred output location: ${D}.`);if(_&&D!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${D}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);b.push(D)}}let I=null;return b.some(k=>k==="gpu-buffer"||k==="ml-tensor"||k==="ml-tensor-cpu-output")&&(u=a._OrtCreateBinding(n),u===0&&fe("Can't create IO binding."),I={handle:u,outputPreferredLocations:b,outputPreferredLocationsEncoded:b.map(k=>k==="ml-tensor-cpu-output"?"ml-tensor":k).map(k=>ga(k))}),ht.set(n,[n,p,m,I,_,!1]),[n,y,w,S,x]}catch(h){throw p.forEach(g=>a._OrtFree(g)),m.forEach(g=>a._OrtFree(g)),u!==0&&a._OrtReleaseBinding(u)!==0&&fe("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&fe("Can't release session."),h}finally{a._free(r),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&fe("Can't release session options."),l.forEach(h=>a._free(h)),a.unmountExternalData?.()}},rn=e=>{let t=ye(),r=ht.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,n,s,u]=r;s&&(u&&t._OrtClearBoundOutputs(s.handle)!==0&&fe("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&fe("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(l=>t._OrtFree(l)),n.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(i)!==0&&fe("Can't release session."),ht.delete(e)},ca=async(e,t,r,i,a,n,s=!1)=>{if(!e){t.push(0);return}let u=ye(),l=u.PTR_SIZE,p=e[0],m=e[1],h=e[3],g=h,_,y;if(p==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let x=e[2].gpuBuffer;y=At(Ct(p),m);{let b=u.jsepRegisterBuffer;if(!b)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');_=b(i,n,x,y)}}else if(h==="ml-tensor"){let x=e[2].mlTensor;y=At(Ct(p),m);let b=u.webnnRegisterMLTensor;if(!b)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');_=b(i,x,Ct(p),m)}else{let x=e[2];if(Array.isArray(x)){y=l*x.length,_=u._malloc(y),r.push(_);for(let b=0;b<x.length;b++){if(typeof x[b]!="string")throw new TypeError(`tensor data at index ${b} is not a string`);u.setValue(_+b*l,Ke(x[b],r),"*")}}else{let b=u.webnnIsGraphInput,I=u.webnnIsGraphOutput;if(p!=="string"&&b&&I){let k=u.UTF8ToString(a);if(b(i,k)||I(i,k)){let E=Ct(p);y=At(E,m),g="ml-tensor";let z=u.webnnCreateTemporaryTensor,O=u.webnnUploadTensor;if(!z||!O)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let v=await z(i,E,m);O(v,new Uint8Array(x.buffer,x.byteOffset,x.byteLength)),_=v}else y=x.byteLength,_=u._malloc(y),r.push(_),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,y),_)}else y=x.byteLength,_=u._malloc(y),r.push(_),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,y),_)}}let w=u.stackSave(),S=u.stackAlloc(4*m.length);try{m.forEach((b,I)=>u.setValue(S+I*l,b,l===4?"i32":"i64"));let x=u._OrtCreateTensor(Ct(p),_,y,S,m.length,ga(g));x===0&&fe(`Can't create tensor for input/output. session=${i}, index=${n}.`),t.push(x)}finally{u.stackRestore(w)}},an=async(e,t,r,i,a,n)=>{let s=ye(),u=s.PTR_SIZE,l=ht.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let p=l[0],m=l[1],h=l[2],g=l[3],_=l[4],y=l[5],w=t.length,S=i.length,x=0,b=[],I=[],k=[],E=[],z=[],O=s.stackSave(),v=s.stackAlloc(w*u),D=s.stackAlloc(w*u),L=s.stackAlloc(S*u),X=s.stackAlloc(S*u);try{[x,b]=sp(n),mt("wasm prepareInputOutputTensor");for(let A=0;A<w;A++)await ca(r[A],I,E,e,m[t[A]],t[A],_);for(let A=0;A<S;A++)await ca(a[A],k,E,e,h[i[A]],w+i[A],_);gt("wasm prepareInputOutputTensor");for(let A=0;A<w;A++)s.setValue(v+A*u,I[A],"*"),s.setValue(D+A*u,m[t[A]],"*");for(let A=0;A<S;A++)s.setValue(L+A*u,k[A],"*"),s.setValue(X+A*u,h[i[A]],"*");if(g&&!y){let{handle:A,outputPreferredLocations:P,outputPreferredLocationsEncoded:J}=g;if(m.length!==w)throw new Error(`input count from feeds (${w}) is expected to be always equal to model's input count (${m.length}).`);mt("wasm bindInputsOutputs");for(let te=0;te<w;te++){let Q=t[te];await s._OrtBindInput(A,m[Q],I[te])!==0&&fe(`Can't bind input[${te}] for session=${e}.`)}for(let te=0;te<S;te++){let Q=i[te];a[te]?.[3]?(z.push(k[te]),s._OrtBindOutput(A,h[Q],k[te],0)!==0&&fe(`Can't bind pre-allocated output[${te}] for session=${e}.`)):s._OrtBindOutput(A,h[Q],0,J[Q])!==0&&fe(`Can't bind output[${te}] to ${P[te]} for session=${e}.`)}gt("wasm bindInputsOutputs"),ht.set(e,[p,m,h,g,_,!0])}s.jsepOnRunStart?.(p),s.webnnOnRunStart?.(p);let W;g?W=await s._OrtRunWithBinding(p,g.handle,S,L,x):W=await s._OrtRun(p,D,v,w,X,S,L,x),W!==0&&fe("failed to call OrtRun().");let F=[],se=[];mt("wasm ProcessOutputTensor");for(let A=0;A<S;A++){let P=Number(s.getValue(L+A*u,"*"));if(P===k[A]||z.includes(k[A])){F.push(a[A]),P!==k[A]&&s._OrtReleaseTensor(P)!==0&&fe("Can't release tensor.");continue}let J=s.stackSave(),te=s.stackAlloc(4*u),Q=!1,ae,M=0;try{s._OrtGetTensorData(P,te,te+u,te+2*u,te+3*u)!==0&&fe(`Can't access output tensor data on index ${A}.`);let Y=u===4?"i32":"i64",K=Number(s.getValue(te,Y));M=s.getValue(te+u,"*");let G=s.getValue(te+u*2,"*"),$e=Number(s.getValue(te+u*3,Y)),Ae=[];for(let me=0;me<$e;me++)Ae.push(Number(s.getValue(G+me*u,Y)));s._OrtFree(G)!==0&&fe("Can't free memory for tensor dims.");let ve=Ae.reduce((me,xe)=>me*xe,1);ae=at(K);let Ee=g?.outputPreferredLocations[i[A]];if(ae==="string"){if(Ee==="gpu-buffer"||Ee==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let me=[];for(let xe=0;xe<ve;xe++){let Be=s.getValue(M+xe*u,"*"),bt=s.getValue(M+(xe+1)*u,"*"),hr=xe===ve-1?void 0:bt-Be;me.push(s.UTF8ToString(Be,hr))}F.push([ae,Ae,me,"cpu"])}else if(Ee==="gpu-buffer"&&ve>0){let me=s.jsepGetBuffer;if(!me)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let xe=me(M),Be=At(K,ve);if(Be===void 0||!Ua(ae))throw new Error(`Unsupported data type: ${ae}`);Q=!0,F.push([ae,Ae,{gpuBuffer:xe,download:s.jsepCreateDownloader(xe,Be,ae),dispose:()=>{s._OrtReleaseTensor(P)!==0&&fe("Can't release tensor.")}},"gpu-buffer"])}else if(Ee==="ml-tensor"&&ve>0){let me=s.webnnEnsureTensor,xe=s.webnnIsGraphInputOutputTypeSupported;if(!me||!xe)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(At(K,ve)===void 0||!Pa(ae))throw new Error(`Unsupported data type: ${ae}`);if(!xe(e,ae,!1))throw new Error(`preferredLocation "ml-tensor" for ${ae} output is not supported by current WebNN Context.`);let Be=await me(e,M,K,Ae,!1);Q=!0,F.push([ae,Ae,{mlTensor:Be,download:s.webnnCreateMLTensorDownloader(M,ae),dispose:()=>{s.webnnReleaseTensorId(M),s._OrtReleaseTensor(P)}},"ml-tensor"])}else if(Ee==="ml-tensor-cpu-output"&&ve>0){let me=s.webnnCreateMLTensorDownloader(M,ae)(),xe=F.length;Q=!0,se.push((async()=>{let Be=[xe,await me];return s.webnnReleaseTensorId(M),s._OrtReleaseTensor(P),Be})()),F.push([ae,Ae,[],"cpu"])}else{let me=Kr(ae),xe=new me(ve);new Uint8Array(xe.buffer,xe.byteOffset,xe.byteLength).set(s.HEAPU8.subarray(M,M+xe.byteLength)),F.push([ae,Ae,xe,"cpu"])}}finally{s.stackRestore(J),ae==="string"&&M&&s._free(M),Q||s._OrtReleaseTensor(P)}}g&&!_&&(s._OrtClearBoundOutputs(g.handle)!==0&&fe("Can't clear bound outputs."),ht.set(e,[p,m,h,g,_,!1]));for(let[A,P]of await Promise.all(se))F[A][2]=P;return gt("wasm ProcessOutputTensor"),F}finally{s.webnnOnRunEnd?.(p),s.stackRestore(O),I.forEach(W=>s._OrtReleaseTensor(W)),k.forEach(W=>s._OrtReleaseTensor(W)),E.forEach(W=>s._free(W)),x!==0&&s._OrtReleaseRunOptions(x),b.forEach(W=>s._free(W))}},nn=e=>{let t=ye(),r=ht.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&fe("Can't get an profile file name."),t._OrtFree(a)},sn=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),ft,Pe,qt,ir,ar,Dr,ha,Ur,It,Et,Od,of,uf,lf,df,pf,cf,hf,ff=U(()=>{"use strict";Le(),sf(),Mt(),Na(),ft=()=>!!be.wasm.proxy&&typeof document<"u",qt=!1,ir=!1,ar=!1,Ur=new Map,It=(e,t)=>{let r=Ur.get(e);r?r.push(t):Ur.set(e,[t])},Et=()=>{if(qt||!ir||ar||!Pe)throw new Error("worker not ready")},Od=e=>{switch(e.data.type){case"init-wasm":qt=!1,e.data.err?(ar=!0,ha[1](e.data.err)):(ir=!0,ha[0]()),Dr&&(URL.revokeObjectURL(Dr),Dr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Ur.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},of=async()=>{if(!ir){if(qt)throw new Error("multiple calls to 'initWasm()' detected.");if(ar)throw new Error("previous call to 'initWasm()' failed.");if(qt=!0,ft())return new Promise((e,t)=>{Pe?.terminate(),ap().then(([r,i])=>{try{Pe=i,Pe.onerror=n=>t(n),Pe.onmessage=Od,ha=[e,t];let a={type:"init-wasm",in:be};!a.in.wasm.wasmPaths&&(r||ma)&&(a.in.wasm.wasmPaths={wasm:new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href}),Pe.postMessage(a),Dr=r}catch(a){t(a)}},t)});try{await Ma(be.wasm),await Ja(be),ir=!0}catch(e){throw ar=!0,e}finally{qt=!1}}},uf=async e=>{if(ft())return Et(),new Promise((t,r)=>{It("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:be}};Pe.postMessage(i)});await en(be,e)},lf=async e=>ft()?(Et(),new Promise((t,r)=>{It("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Pe.postMessage(i,[e.buffer])})):jr(e),df=async(e,t)=>{if(ft()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Et(),new Promise((r,i)=>{It("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),Pe.postMessage(a,n)})}else return tn(e,t)},pf=async e=>{if(ft())return Et(),new Promise((t,r)=>{It("release",[t,r]);let i={type:"release",in:e};Pe.postMessage(i)});rn(e)},cf=async(e,t,r,i,a,n)=>{if(ft()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Et(),new Promise((s,u)=>{It("run",[s,u]);let l=r,p={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:n}};Pe.postMessage(p,sn(l))})}else return an(e,t,r,i,a,n)},hf=async e=>{if(ft())return Et(),new Promise((t,r)=>{It("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Pe.postMessage(i)});nn(e)}}),fa,Rd,mf,H0=U(()=>{"use strict";Le(),ff(),ee(),Ba(),up(),fa=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Rd=e=>{switch(e[3]){case"cpu":return new Ze(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Ua(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return Ze.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Pa(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return Ze.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},mf=class{async fetchModelAndCopyToWasmMemory(e){return lf(await qa(e))}async loadModel(e,t){Xe();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await df(r,t),qe()}async dispose(){return pf(this.sessionId)}async run(e,t,r){Xe();let i=[],a=[];Object.entries(e).forEach(h=>{let g=h[0],_=h[1],y=this.inputNames.indexOf(g);if(y===-1)throw new Error(`invalid input '${g}'`);i.push(_),a.push(y)});let n=[],s=[];Object.entries(t).forEach(h=>{let g=h[0],_=h[1],y=this.outputNames.indexOf(g);if(y===-1)throw new Error(`invalid output '${g}'`);n.push(_),s.push(y)});let u=i.map((h,g)=>fa(h,()=>`input "${this.inputNames[a[g]]}"`)),l=n.map((h,g)=>h?fa(h,()=>`output "${this.outputNames[s[g]]}"`):null),p=await cf(this.sessionId,a,u,s,l,r),m={};for(let h=0;h<p.length;h++)m[this.outputNames[s[h]]]=n[h]??Rd(p[h]);return qe(),m}startProfiling(){}endProfiling(){hf(this.sessionId)}}}),gf={};Gt(gf,{OnnxruntimeWebAssemblyBackend:()=>Ca,initializeFlags:()=>za,wasmBackend:()=>yf});var za,Ca,yf,F0=U(()=>{"use strict";Le(),ff(),H0(),za=()=>{(typeof be.wasm.initTimeout!="number"||be.wasm.initTimeout<0)&&(be.wasm.initTimeout=0);let e=be.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),be.wasm.simd=!1),typeof be.wasm.proxy!="boolean"&&(be.wasm.proxy=!1),typeof be.wasm.trace!="boolean"&&(be.wasm.trace=!1),typeof be.wasm.numThreads!="number"||!Number.isInteger(be.wasm.numThreads)||be.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)be.wasm.numThreads=1;else{let t=typeof navigator>"u"?Og("node:os").cpus().length:navigator.hardwareConcurrency;be.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ca=class{async init(e){za(),await of(),await uf(e)}async createInferenceSessionHandler(e,t){let r=new mf;return await r.loadModel(e,t),r}},yf=new Ca});Le();Le();Le();var j0="1.27.0",K0=Yd;{let e=(F0(),dr(gf)).wasmBackend;Ot("webgpu",e,5),Ot("webnn",e,5),Ot("cpu",e,10),Ot("wasm",e,10)}Object.defineProperty(be.versions,"web",{value:j0,enumerable:!0});export{Ot as a,be as b,Ze as c,pr as d,Xe as e,qe as f,mt as g,gt as h,Ra as i,K0 as j,Z0 as k};
/*! Bundled license information:

onnxruntime-web/dist/ort.bundle.min.mjs:
  (*!
   * ONNX Runtime Web v1.27.0
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)

onnxruntime-web/dist/ort.bundle.min.mjs:
  (**
   * @license
   * Copyright 2021 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2020 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2019 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
*/
