package handlers

import (
  "testing"
	"net/http"
  "fmt"
	"gopkg.in/check.v1"
)

func Test(t *testing.T) { check.TestingT(t) }

type S struct {}


func (s *S) TestBridge(c *check.C) {
	request, err := http.NewRequest("GET", "/bridge", nil)
  fmt.Printf("\n\nRequest :%#v ",request.URL)
	c.Assert(err, check.IsNil)

}
