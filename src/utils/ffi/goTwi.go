package main

/*
#include <stdlib.h>
#include <string.h>
typedef void (*CBFunction)(void*, unsigned);
static inline void Invoke(void* res, CBFunction* callback) {
	char* cstr = (char*)res;
	return (*callback)(res, strlen(cstr));
}
*/
import "C"
import (
	"context"
	"encoding/json"
	"net/http"
	"time"
	"unsafe"

	"github.com/michimani/gotwi"
	"github.com/michimani/gotwi/tweet/filteredstream"
	"github.com/michimani/gotwi/tweet/filteredstream/types"
)

type StreamJSON struct {
	Data *types.SearchStreamOutput `json:"data,omitempty"`
}

type GoTwiError struct {
	Error   bool   `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

var ACCESS_TOKEN = ""

//export setAccessToken
func setAccessToken(token *C.char) *C.void {
	ACCESS_TOKEN = C.GoString(token)
	return nil
}

/**
*	creates a new gotwi.Client with a custom
* http.Client and arbitrary timeout arg
 */
func newGotwiClientWithTimeout(timeout int, token string) (*gotwi.Client, error) {
	in := &gotwi.NewClientWithAccessTokenInput{
		AccessToken: token,
		HTTPClient: &http.Client{
			Timeout: time.Duration(timeout) * time.Second,
		},
	}
	return gotwi.NewClientWithAccessToken(in)
}

/**
*	FFI Export: used to list search stream rules
 */
//export listSearchStreamRules
func listSearchStreamRules() *C.char {
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	p := &types.ListRulesInput{}
	res, err := filteredstream.ListRules(context.Background(), c, p)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}
	result := C.CString(string(out))
	defer C.free(unsafe.Pointer(result))
	return result
}

//export deleteSearchStreamRule
func deleteSearchStreamRule(rule_id_char *C.char) *C.char {
	ruleID := C.GoString(rule_id_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	p := &types.DeleteRulesInput{
		Delete: &types.DeletingRules{
			IDs: []string{
				ruleID,
			},
		},
	}

	res, err := filteredstream.DeleteRules(context.TODO(), c, p)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}
	result := C.CString(string(out))
	defer C.free(unsafe.Pointer(result))
	return result
}

/**
*	adds a rule to the search stream
 */
//export addSearchStreamRule
func addSearchStreamRule(keyword_char *C.char) *C.char {
	keyword := C.GoString(keyword_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	p := &types.CreateRulesInput{
		Add: []types.AddingRule{
			{Value: gotwi.String(keyword), Tag: gotwi.String(keyword)},
		},
	}

	res, err := filteredstream.CreateRules(context.TODO(), c, p)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &GoTwiError{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		out := C.CString(string(errJSON))
		defer C.free(unsafe.Pointer(out))
		return out
	}
	result := C.CString(string(out))
	defer C.free(unsafe.Pointer(result))
	return result
}

func handleError(err error, callback *C.CBFunction) {
	errFmt := &GoTwiError{
		Error:   true,
		Message: err.Error(),
	}
	errJSON, _ := json.Marshal(errFmt)
	str := unsafe.Pointer(C.CString(string(errJSON)))
	defer C.free(str)
	C.Invoke(str, callback)
}

//export execSearchStream
func execSearchStream(params *C.char, callback C.CBFunction) {
	f := &callback
	c, err := newGotwiClientWithTimeout(0, ACCESS_TOKEN)
	if err != nil {
		handleError(err, f)
	}

	var p = &types.SearchStreamInput{}
	err = json.Unmarshal([]byte(C.GoString(params)), p)
	if err != nil {
		handleError(err, f)
	}
	s, err := filteredstream.SearchStream(context.Background(), c, p)
	if err != nil {
		handleError(err, f)
	}

	for s.Receive() {
		t, err := s.Read()
		if err != nil {
			handleError(err, f)
		} else {
			if t != nil {
				out, err := json.Marshal(t)
				if err != nil {
					handleError(err, f)
				}
				str := unsafe.Pointer(C.CString(string(out)))
				defer C.free(str)
				C.Invoke(str, f)
			}
		}
	}
}

func main() {} // unused, but required for compile
