package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
)

var ATTACHHOST = []string{"AttachOneHost"}

type AttachOneHost struct {
	All              bool
  AttachOneHost  bool
	InfoDriver string
	HostName string
  Vm  string
  Networking string
	Username string
	Password string
	Host string
}



func (i *AttachOneHost) SetAttachOneHost(infodriver, vm, hostname, network, host,username,password string) error  {
  var outBuffer bytes.Buffer
  writer := io.MultiWriter(&outBuffer, os.Stdout)
  fmt.Printf("Before sent %#v:",outBuffer)

a := AttachOneHost{All: false, AttachOneHost: true,  InfoDriver: infodriver, HostName: hostname, Vm: vm, Networking: network,  Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
	c.IfNoneAddPackages(ATTACHHOST)
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
