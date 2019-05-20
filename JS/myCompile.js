function Compile(el, vm) {
    let me = this
    me.$vm = vm
    //这里没有判断el是不是合法的，而是放在了myVue中
    me.$el = me.isElementNode(el)
                ? el
                : document.querySelector(el)
    if(me.$el) {
        me.$fragment = me.node2Fragment(me.$el)
        me.init()
        me.$el.appendChild(me.$fragment)  //init函数必须在这一步之前，因为init函数内部其实是在解析模板指令，解析完了为原生模板才会给实例对象
    }
}


Compile.prototype = {
    node2Fragment(el) {
        //创建document碎片
        let child
        let fragment = document.createDocumentFragment()
        //将原生结点拷贝到fragment里
        while(child = el.firstChild) {
            fragment.appendChild(child)  //appendChild是移动当前结点到目标节点并不会保留原节点，若要保留先用Node.cloneNode方法复制出副本
        }
        return fragment
    },
    init() {
        this.compileElement(this.$fragment)
    },
    compileElement(el) {
        let me = this
        let reg = /\{\{(.*)\}\}/
        let childNodes = el.childNodes  //childNodes包含的有text和comment结点，而children里只有元素节点，但他们的构造函数都是NodeList
        // NodeList构造出来的实例就有forEach方法用来遍历,但不是Array的实例，即不是数组

        // console.log(Object.prototype.toString.call(childNodes))
        //这里的正则表达式并没有涉及到匹配到哪个的问题，仅仅是匹配的第一个，而且不能识别
        childNodes.forEach(node => {
            let nodeContent = node.textContent
            if(me.isElementNode(node)) {
                me.compileNode(node)
            }else if(me.isTextNode(node) && reg.test(nodeContent)) {
                me.compileText(node, RegExp.$1.trim()) //最后的正则表达式是指的最后一次匹配得到的第一个字符串
            }
            if(node.childNodes && node.childNodes.length) {
                me.compileElement(node) //递归所有的子结点
            }
        })
    },

    compileNode(node) {
        let me = this
        let nodeAttrs = node.attributes
        //这里的nodeAttrs实现的是一个类似于map
        Array.prototype.slice.call(nodeAttrs).forEach(attr => {
            let attrName = attr.name
            if(me.isDirective(attrName)) {
                let exp = attr.value
                let dir = attrName.substring(2)
                //myVue事件指令
                if(me.isEventDirective(dir)) {
                    compileGroup.eventHandler(node, me.$vm, exp, dir)
                }else{//普通指令
                    compileGroup[dir] && compileGroup[dir](node, me.$vm, exp)
                }
                node.removeAttribute(attrName)  //指令解析完之后移除指令名。但只是 "v-on:click='show'" 属性被移除，事件监听依然还在。
            }
        })
    },
    //编译文本
    compileText(node, expAns) {
        compileGroup.text(node, this.$vm, expAns)
    },
    //判断是否是myVue指令
    isDirective(attr) {
        return attr.indexOf('v-') === 0
    },
    //判断是否是myVue事件指令
    isEventDirective(dir) {
        return dir.indexOf('on') === 0
    },
    //判断是否是元素节点
    isElementNode(el) {
        return el.nodeType === 1
    },
    //判断是否是文本节点
    isTextNode(el) {
        return el.nodeType === 3
    }
}

//指令处理的集合
const compileGroup = {
    // myVue事件指令处理
    eventHandler(node, vm, exp, dir) {
        let eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false)  //这里必须要绑定vm，因为methods中的方法要访问vm中的数据，如data.name
        }
    },

    // myVue普通指令处理
    text(node, vm, expAns) {
        this.bind(node, vm, expAns, 'text')
    },
    html(node, vm, expAns) {
        this.bind(node, vm, expAns, 'html')
    },
    class(node, vm, expAns) {
        this.bind(node, vm, expAns, 'class')
    },
    model(node, vm, expAns) {
        this.bind(node, vm, expAns, 'model')

        let me = this,
            val = this._getVmVal(vm, expAns)
        node.addEventListener('input', e => {  //就在这里指定了v-model是input框才有的
            let newValue = e.target.value
            if (val === newValue) {
                return;
            }
            me._setVmVal(vm, expAns, newValue)
            val = newValue
        })
    },
    bind(node, vm, expAns, dir) {
        let updateFn = updater[dir + 'Updater']
        updateFn && updateFn(node, this._getVmVal(vm, expAns))
        //每当更新了数据，都需要新增一个观察者
        //这里直接调用上面的updateFn并不是草率，因为通过同样的updateFn获得的结果必定类型不变
        new Watcher(vm, expAns, (val, oldVal) => updateFn && updateFn(node, val, oldVal))
    },
    _getVmVal(vm, expAns) {
        let val = vm
        expAns = expAns.split('.')
        expAns.forEach(k => val = val[k])
        return val
    },
    _setVmVal(vm, expAns, value) {
        expAns = expAns.split('.')
        let val = vm
        expAns.forEach((k, i) => {
            // 非最后一个key，更新val的值
            if (i < expAns.length-1) {
                val = val[k]
            } else {
                val[k] = value
            }
        })
    }
}
//最后一步，运行到这里时才会进行真正的处理数据
const updater = {
    textUpdater(node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value
    },
    htmlUpdater(node, value) {
        node.innerHTML = typeof value === 'undefined' ? '' : value
    },
    classUpdater(node, value, oldValue) {
        let className = node.className  //可能会有静态的原生的html标签中的class

        node.className = className + (className? ' ' : '') + value //原文中这里写的很复杂，稍作修改
    },

    modelUpdater(node, value, oldValue) {
        node.value = typeof value === 'undefined' ? '' : value
    }
}