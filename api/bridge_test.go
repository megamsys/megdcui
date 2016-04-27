package api

import (

	"net/http"
  "fmt"
	"gopkg.in/check.v1"
)

func (s *S) TestBridge(c *check.C) {
	request, err := http.NewRequest("GET", "/bridge", nil)
  fmt.Printf("\n\nRequest :%#v ",request.URL)
	c.Assert(err, check.IsNil)

}
