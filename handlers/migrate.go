package handlers

import (
	"net/http"
  "encoding/json"
  "fmt"
  "errors"
	log "github.com/Sirupsen/logrus"
  _ "github.com/megamsys/megdcui/migration/solusvm"
  "github.com/megamsys/megdcui/automation"
	"github.com/megamsys/megdcui/migration"
)

const(
	defaultServer = "solusvm"
)

var register migration.DataCenter

func Migrate(w http.ResponseWriter, r *http.Request) error {
	hostinfo := &automation.HostInfo{
		SolusMaster:  "103.56.92.58",
		Id: "iy9rRvifGKajunciPcu5V13ANyAmVnvklN2HV8cv",
		Key: "8mQloZ1rjkl6bevOCW2o0mykZpSLnV8l8OwmCnEN",
		SolusNode: "158.69.240.220",
	}


	a, err := migration.Get(defaultServer)

	if err != nil {
		log.Errorf("fatal error, couldn't locate the Server %s", defaultServer)
		return err
	}

	register = a

	if migrationHost, ok := register.(migration.MigrationHost); ok {

		err = migrationHost.MigratablePrepare(hostinfo)
		if err != nil {
			log.Errorf("fatal error, couldn't Migrate %s solusvm master", hostinfo.SolusMaster)
			return err
		} else {
			log.Debugf("%s Can Migratable", hostinfo.SolusMaster)
		}
     res, er := migrationHost.MigrateHost(hostinfo)
		 if er != nil {
 			log.Errorf("fatal error, couldn't Migrate %s solusvm node", hostinfo.SolusNode)
 			return er
 		}
		b, eror := json.Marshal(res)
    if eror != nil {
        fmt.Printf("Error: %s", eror)
        return eror;
    }

		fmt.Println("\n Result json for api call ",string(b))
		return errors.New(string(b))
	}

	return nil
}
