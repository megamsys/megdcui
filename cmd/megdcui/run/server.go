package run

import (
	"fmt"
	"os"
	"runtime"
	"runtime/pprof"

	log "github.com/Sirupsen/logrus"
	pp "github.com/megamsys/libgo/cmd"
	"github.com/megamsys/megdcui/subd/httpd"
	"github.com/megamsys/megdcui/meta"
)

// Server represents a container for the metadata and storage data and services.
// It is built using a config and it manages the startup and shutdown of all
// services in the proper order.
type Server struct {
	version string // Build version

	err      chan error
	closing  chan struct{}
	Services []Service

	// Profiling
	CPUProfile string
	MemProfile string
}

// NewServer returns a new instance of Server built from a config.
func NewServer(c *Config, version string) (*Server, error) {
	s := &Server{
		version: version,
		err:     make(chan error),
		closing: make(chan struct{}),
	}

	s.appendHTTPDService(c.Meta, c.HTTPD)

	return s, nil
}

func (s *Server) appendHTTPDService(c *meta.Config,h *httpd.Config) {
	e := *h
	if !e.Enabled {
		log.Warn("skip httpd service.")
		return
	}
	srv := httpd.NewService(c,h)
	s.Services = append(s.Services, srv)
}

// Err returns an error channel that multiplexes all out of band errors received from all services.
func (s *Server) Err() <-chan error { return s.err }

// Open opens the meta and data store and all services.
func (s *Server) Open() error {
	if err := func() error {
		//Start profiling, if set.
		startProfile(s.CPUProfile, s.MemProfile)
		//go s.monitorErrorChan(s.?.Err())
		for _, service := range s.Services {
			if err := service.Open(); err != nil {
				return fmt.Errorf("open service: %s", err)
			}
		}
		log.Debug(pp.Colorfy("ō͡≡o˞̶  engine up", "green", "", "bold"))
		return nil

	}(); err != nil {
		s.Close()
		return err
	}

	return nil
}

// Close shuts down the meta and data stores and all services.
func (s *Server) Close() error {
	stopProfile()

	for _, service := range s.Services {
		service.Close()
	}

	if s.closing != nil {
		close(s.closing)
	}

	/*if s.eventHander !=nil {
		s.CloseEventChannel
	}*/
	return nil
}

// monitorErrorChan reads an error channel and resends it through the server.
func (s *Server) monitorErrorChan(ch <-chan error) {
	for {
		select {
		case err, ok := <-ch:
			if !ok {
				return
			}
			s.err <- err
		case <-s.closing:
			return
		}
	}
}

// Service represents a service attached to the server.
type Service interface {
	Open() error
	Close() error
}

// prof stores the file locations of active profiles.
var prof struct {
	cpu *os.File
	mem *os.File
}

// StartProfile initializes the cpu and memory profile, if specified.
func startProfile(cpuprofile, memprofile string) {
	if cpuprofile != "" {
		f, err := os.Create(cpuprofile)
		if err != nil {
			log.Errorf("cpuprofile: %v", err)
		}
		log.Infof("writing CPU profile to: %s", cpuprofile)
		prof.cpu = f
		pprof.StartCPUProfile(prof.cpu)
	}

	if memprofile != "" {
		f, err := os.Create(memprofile)
		if err != nil {
			log.Errorf("memprofile: %v", err)
		}
		log.Infof("writing mem profile to: %s", memprofile)
		prof.mem = f
		runtime.MemProfileRate = 4096
	}

}

// StopProfile closes the cpu and memory profiles if they are running.
func stopProfile() {
	if prof.cpu != nil {
		pprof.StopCPUProfile()
		prof.cpu.Close()
		log.Infof("CPU profile stopped")
	}
	if prof.mem != nil {
		pprof.Lookup("heap").WriteTo(prof.mem, 0)
		prof.mem.Close()
		log.Infof("mem profile stopped")
	}
}
