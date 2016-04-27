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
bridge := "one"
iptype := "IP4"
ip := "103.56.92.25"
size := "2"
dns1 := "8.8.8.8"
dns2 := "8.8.4.4"
netmask := "255.255.252.0"
gateway := "103.56.92.1"

a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Host %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.CreateNetwork(bridge, iptype, ip, size, dns1, dns2, network, gateway, host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
