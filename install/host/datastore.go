package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
)

var DATASTORE = []string{"CreateDatastoreLvm"}

type CreateDatastoreLvm struct {
	All              bool
	CreateDatastoreLvm    bool
	PoolName string
  VgName  string
	Hostname string
	Username string
	Password string
	Host string
}




func (i *CreateDatastoreLvm) CreateDatastore(poolname, vgname, hostname, host,username,password string) error  {
  var outBuffer bytes.Buffer
  writer := io.MultiWriter(&outBuffer, os.Stdout)
  fmt.Printf("Before sent %#v:",outBuffer)

a := CreateDatastoreLvm{All: false, CreateDatastoreLvm: true,  PoolName: poolname,  VgName: vgname, Hostname: hostname,  Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
	c.IfNoneAddPackages(DATASTORE)
	if h, err := handler.NewHandler(c); err != nil {
		return err
	} else if err := h.Run(writer); err != nil {
		return err
	}
  w, _ := os.Create("/home/dat2")
  n2, _ := w.Write(outBuffer.Bytes())
  //fmt.Print(writer.String())
  fmt.Printf("%#v",writer)
  fmt.Println(n2)

return nil
}
