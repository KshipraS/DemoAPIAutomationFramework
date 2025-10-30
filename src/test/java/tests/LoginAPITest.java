
package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

public class LoginAPITest 
{
	@Test(description="Verify the Login")
	public void loginTest()
	{
		RestAssured.baseURI="http://64.227.160.186:8080";
		RequestSpecification requestSpecfication=RestAssured
													.given()
													.header("Content-Type","application/json")
													.body("{\r\n"
															+ "  \"username\": \"string\",\r\n"
															+ "  \"password\": \"string\"\r\n"
															+ "}");
		Response response = requestSpecfication.post("api/auth/login");		// end point
		System.out.print(response.asPrettyString());
		Assert.assertEquals(response.getStatusCode(), 200);
	}
}
