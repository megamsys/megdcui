package api

import (
	"net/http"
	"fmt"
	log "github.com/Sirupsen/logrus"
  _ "github.com/megamsys/megdcui/migration/solusvm"
  "github.com/megamsys/megdcui/automation"
	"github.com/megamsys/megdcui/migration"
	//	"github.com/megamsys/megdcui/meta"
)

const(
	defaultServer = "solusvm"
)

var register migration.DataCenter
func migrate(w http.ResponseWriter, r *http.Request) error {
//  meta.NewConfig().MkGlobal()
	fmt.Println("**************api/migrate********************")

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
