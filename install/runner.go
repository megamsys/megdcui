package install

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
  )



func  Runner(packages []string, i *handler.WrappedParms) error {
  var outBuffer bytes.Buffer
 writer := io.MultiWriter(&outBuffer, os.Stdout)
 fmt.Printf("Before sent %#v:",outBuffer)

  i.IfNoneAddPackages(packages)
	if h, err := handler.NewHandler(i); err != nil {
		return err
	} else if err := h.Run(writer); err != nil {
  
    fmt.Println(err)
		return err
	}

  s := outBuffer.String()
  fmt.Println(s)
	return nil
}
