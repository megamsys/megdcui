package api

import (
	"net/http"
	"fmt"
	log "github.com/Sirupsen/logrus"

	"github.com/megamsys/megdcui/migration"
)

const(
	defaultServer = "solusvm"
)

var register migration.DataCenter
func migrate(w http.ResponseWriter, r *http.Request) error {
  masterip := "103.56.92.58"
	id := "eurssfsjhiosdnfms"
	key := "sdgsdgawrsdgsw23"

	a, err := migration.Get(defaultServer)

	if err != nil {
		log.Errorf("fatal error, couldn't locate the Server %s", defaultServer)
		return err
	}

	register = a

	if migrationHost, ok := register.(migration.MigrationHost); ok {

		err = migrationHost.MigratablePrepare(masterip,id,key)
		if err != nil {
			log.Errorf("fatal error, couldn't Migrate %s solusvm master", masterip)
			return err
		} else {
			log.Debugf("%s Can Migratable", masterip)
			return nil
		}

	}

	fmt.Println("*************************************")
	fmt.Println()
  /*b :=&provision.Box{
    BaseUrl: "https://103.56.92.58:5656/api/admin/command.php",
    Id: "sedfwesdvsdghfh",
    Key: "fdfrg45dgvg24db",
  }
	err :=provision.Deploy(&provision.DeployOpts{B: b})
	if err != nil {
		return err
	}*/
	return nil
}
