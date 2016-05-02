package api

import (
	"net/http"
		log "github.com/Sirupsen/logrus"
		"github.com/megamsys/megdcui/install"
		_ "github.com/megamsys/megdcui/install"
)

func network(w http.ResponseWriter, r *http.Request) error {
	var register install.Host
host := "localhost"
username := ""
password := ""
bridgename := "one"
iptype := "IP4"
ip := ""
size := ""
dnsname1 := ""
dnsname2 := ""
netmask := ""
gateway := ""
a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Host %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.CreateNetwork(bridgename, iptype, ip, size, dnsname1, dnsname2, netmask, gateway ,host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
