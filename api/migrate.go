package api

import (
	"net/http"
	"fmt"
)

func migrate(w http.ResponseWriter, r *http.Request) error {
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
