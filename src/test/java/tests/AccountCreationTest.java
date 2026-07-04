package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import io.restassured.response.Response;
import models.request.SignUpRequest;
import services.AuthenticationService;
import util.ConfigReader;

public class AccountCreationTest 
{
	@Test(description="Verify the Account Create")
	public void createAccountTest()
	{
		String uniqueSuffix = String.valueOf(System.currentTimeMillis());
		SignUpRequest signUpRequest = new SignUpRequest.Builder()
													    .firstName(ConfigReader.get("newUser.firstName"))
													    .email(uniqueSuffix + ConfigReader.get("newUser.email"))
													    .lastName(ConfigReader.get("newUser.lastName"))
													    .mobileNumber(ConfigReader.get("newUser.mobileNumber"))
													    .userName(ConfigReader.get("newUser.username") + uniqueSuffix)
													    .password(ConfigReader.get("newUser.password"))
													    .build();	
		
		AuthenticationService authService=new AuthenticationService();
		Response response=authService.signUp(signUpRequest);
		System.out.print(response.asPrettyString());
		Assert.assertEquals(response.asString(), "User registered successfully!");
		//Assert.assertEquals(response.jsonPath().getString("message"), "User registered successfully!");
		//Assert.assertEquals(response.asPrettyString(), "Error: Username is already taken!");
	}		
}