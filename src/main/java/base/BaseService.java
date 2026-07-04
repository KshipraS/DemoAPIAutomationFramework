/**
 * This class acts as a wrapper for RestAssured. It is responsible for providing Base URI to all classes as all service classes are extending this class, 
 * creating the Request and handling the Response.
 * Swagger: http://64.227.160.186:8080/swagger-ui/index.html
 */

package base;

import static io.restassured.RestAssured.given;

import api.filters.LoggingFilter;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import util.ConfigReader;

public class BaseService 
{
	private static final String BASE_URI=ConfigReader.get("base.url");
	private RequestSpecification requestSpecification;	// it is an Interface. We use it for request reusability.
	
	static		// to call filters implementation for printing request and response in logs
	{
		RestAssured.filters(new LoggingFilter());
	}
	
	public BaseService()
	{
		requestSpecification=given()
								.baseUri(BASE_URI);
		//requestSpecification=given();		// if base url is different, then do not set it here -CASE
	}
	
	//protected Response postRequest(LoginRequest loginRequest, String endpoint)	// Can only serve one request i.e. login
	protected Response postRequest(Object request, String endpoint)	// Making it Loosely coupled so that it can handle all requests
	{
		return requestSpecification
				.contentType(ContentType.JSON)
				.body(request)
				.post(endpoint);
	}
	
	// Add below overloaded method for line 23 CASE where you pass the URI as well
	/*protected Response postRequest(String baseURI,Object loginRequest, String endpoint)	// Making it Loosely coupled so that it can handle all requests
	{
		return requestSpecification
				.baseUri(baseURI)
				.contentType(ContentType.JSON)
				.body(loginRequest)
				.post(endpoint);
	}*/
	
	protected Response putRequest(Object request, String endpoint)	// Making it Loosely coupled so that it can handle all requests
	{
		return requestSpecification
				.contentType(ContentType.JSON)
				.body(request)
				.put(endpoint);
	}
	
	protected Response getRequest(String endpoint)
	{
		return requestSpecification
				.get(endpoint);
	}
	
	protected void setAuthToken(String token)
	{
		requestSpecification
			.header("Authorization", "Bearer "+token);
	}
	
}
