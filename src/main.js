import { createApp } from "vue"
import { Button, Icon, Loading, NavBar, Popup, Search, Switch } from "vant"
import App from "./App.vue"
import "vant/es/button/style/index"
import "vant/es/icon/style/index"
import "vant/es/loading/style/index"
import "vant/es/nav-bar/style/index"
import "vant/es/popup/style/index"
import "vant/es/search/style/index"
import "vant/es/switch/style/index"
import "./style.css"

const app = createApp(App)
app.use(Button)
app.use(Icon)
app.use(Loading)
app.use(NavBar)
app.use(Popup)
app.use(Search)
app.use(Switch)
app.mount("#app")
