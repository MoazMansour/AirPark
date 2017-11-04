package com.csc212.airpark.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ErrorAttributes;
import org.springframework.boot.autoconfigure.web.ErrorController;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Controller
public class RESTErrorController implements ErrorController
{
    private Logger log = LoggerFactory.getLogger( RESTErrorController.class );

    private static final String PATH = "/error";

    @Autowired
    ErrorAttributes errorAttributes;

    //If this was an application/json request, return json
    @RequestMapping( value = PATH)
    public View errorJson(HttpServletRequest req,
                          HttpServletResponse resp,
                          Model m )
    {
        ServletWebRequest webRequest = new ServletWebRequest(req,resp);
        m.addAllAttributes( errorAttributes.getErrorAttributes( webRequest, false ) );
        log.error( "JSON Error: {} {}", m.asMap(), errorAttributes );
        MappingJackson2JsonView v = new MappingJackson2JsonView();
        v.setAttributesMap( m.asMap() );
        v.setContentType( MediaType.APPLICATION_JSON_UTF8_VALUE );
        resp.setContentType( MediaType.APPLICATION_JSON_UTF8_VALUE );
        return v;
    }

    @Override
    public String getErrorPath() {
        return PATH;
    }
}
