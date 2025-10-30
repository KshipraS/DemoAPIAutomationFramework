
package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.*;	// static imports improve readability. ln 16 no longer needs RestAssured. call
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

public class LoginAPITest2 
{
	@Test(description="Verify the Login")
	public void loginTest()
	{
		RequestSpecification requestSpecfication=given()
												.baseUri("http://64.227.160.186:8080")
												.header("Content-Type","application/json")
												.body("{\r\n"
														+ "  \"username\": \"string\",\r\n"
														+ "  \"password\": \"string\"\r\n"
														+ "}");
		Response response = requestSpecfication.post("api/auth/login");		// end point
		System.out.print(response.asPrettyString());
		Assert.assertEquals(response.getStatusCode(), 220);
	}
}
