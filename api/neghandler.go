package api

import (
	"github.com/codegangsta/negroni"
	"github.com/megamsys/megdcui/handlers"
	"github.com/rs/cors"
	"net/http"
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
	m.Add("POST", "/hostinfos/content", Handler(handlers.HostInfosContent))
	m.Add("POST", "/hostinfos/install", Handler(handlers.HostInfosInstall))

	m.Add("GET", "/hostcheck", Handler(handlers.HostCheck))
	m.Add("GET", "/bridge", Handler(handlers.Bridge))
	m.Add("GET", "/network", Handler(handlers.Network))
	m.Add("GET", "/migrate", Handler(handlers.Migrate))
	m.Add("GET", "/attachonehost", Handler(handlers.AttachOneHost))
	m.Add("GET", "/datastore", Handler(handlers.DataStore))
	m.Add("GET", "/onehosts", Handler(handlers.OneHosts))
	m.Add("Post", "/onestorages", Handler(handlers.OneStorages))
	m.Add("Post", "/configurations", Handler(handlers.Configurations))
	m.Add("Post", "/accounts/content", Handler(handlers.Accounts))
	m.Add("Post", "/login", Handler(handlers.Accounts))
	//m.Add("Get", "/", home.HomeHandler)
	//m.Add("Get", "/logs", Handler(logs))
	m.Add("POST", "/ping", Handler(ping))
	//we can use this as a single click Terminal launch for docker.
	//m.Add("Get", "/apps/{appname}/shell", websocket.Handler(remoteShellHandler))
	//r := mux.NewRouter()
	n := negroni.Classic()
	//n.UseHandler(r)
	http.Handle("/", http.FileServer(http.Dir("./../public/")))
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
