package api

import (
	"net/http"
    "github.com/gorilla/mux"
	"github.com/codegangsta/negroni"
	"github.com/rs/cors"
)

type MegdHandler struct {
	method string
	path   string
	h      http.Handler
}

var megdHandlerList []MegdHandler

//RegisterHandler inserts a handler on a list of handlers
func RegisterHandler(path string, method string, h http.Handler) {
	var th MegdHandler
	th.path = path
	th.method = method
	th.h = h
	megdHandlerList = append(megdHandlerList, th)
}

// RunServer starts vertice httpd server.
func NewNegHandler() *negroni.Negroni {
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	})

	m := &delayedRouter{}

	for _, handler := range megdHandlerList {
		m.Add(handler.method, handler.path, handler.h)
	}
	m.Add("GET", "/hostinfos", Handler(hostinfos))
  m.Add("GET", "/migrate", Handler(migrate))
//  m.Add("GET", "/hostcheck", Handler(hostcheck))
	m.Add("GET", "/bridge", Handler(bridge))
	m.Add("Post", "/onehosts", Handler(onehosts))
	m.Add("Post", "/onestorages", Handler(onestorages))
	m.Add("Post", "/configurations", Handler(configurations))
	  //m.Add("Get", "/", home.HomeHandler)
	//m.Add("Get", "/logs", Handler(logs))
 	m.Add("GET", "/ping", Handler(ping))
	//we can use this as a single click Terminal launch for docker.
	//m.Add("Get", "/apps/{appname}/shell", websocket.Handler(remoteShellHandler))
	r := mux.NewRouter()
	n := negroni.Classic()
	n.UseHandler(r)
	http.Handle("/", http.FileServer(http.Dir("./../app/")))
	//n := negroni.New()
	n.Use(negroni.NewRecovery())
	n.Use(c)
	n.Use(newLoggerMiddleware())
	n.UseHandler(m)
	n.Use(negroni.HandlerFunc(contextClearerMiddleware))
	n.Use(negroni.HandlerFunc(flushingWriterMiddleware))
	n.Use(negroni.HandlerFunc(errorHandlingMiddleware))
	n.Use(negroni.HandlerFunc(authTokenMiddleware))
	n.UseHandler(http.HandlerFunc(runDelayedHandler))
	return n
}
