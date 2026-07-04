package tests;

import org.testng.annotations.Test;

import io.restassured.response.Response;
import services.AuthenticationService;
import util.ConfigReader;

public class ForgotPasswordTest 
{
	@Test(description="Verify the Forgot Passord operation")
	public void forgotPasswordTest()
	{
		AuthenticationService authService=new AuthenticationService();
		Response response=authService.forgotPassword(ConfigReader.get("test.email"));
		System.out.print(response.asPrettyString());
	}
}
