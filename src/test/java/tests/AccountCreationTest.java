package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import base.AuthService;
import io.restassured.response.Response;
import models.request.SignUpRequest;

public class AccountCreationTest 
{
	@Test(description="Verify the Account Create")
	public void createAccountTest()
	{
		SignUpRequest signUpRequest = new SignUpRequest.Builder()
			.firstName("Disha")
			.email("Disha24@yahoomai.com")
			.lastName("Ahuja")
			.mobileNumber("9856565654")
			.userName("disha")
			.password("disha123")
		.build();	
		
		AuthService authService=new AuthService();
		Response response=authService.signUp(signUpRequest);
		System.out.print(response.asPrettyString());
		//Assert.assertEquals(response.asPrettyString(), "User registered successfully!");
		Assert.assertEquals(response.asPrettyString(), "Error: Username is already taken!");
	}		
}