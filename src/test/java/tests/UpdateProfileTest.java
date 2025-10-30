package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import base.BaseService;
import base.UserProfileManagementService;
import io.restassured.response.Response;
import models.request.UserProfileRequest;
import models.response.LoginResponse;
import models.response.UserProfileResponse;
import util.Utility;

public class UpdateProfileTest
{
	@Test
	public void updateProfile()
	{
		LoginResponse loginResponse=new Utility().doLogin("Kshipra","Kshipra123");
		
		UserProfileManagementService userProfileManagementService=new UserProfileManagementService();
		Response response=userProfileManagementService.getProfile(loginResponse.getToken());
		System.out.println(response.asPrettyString());
		
		UserProfileResponse userProfileResponse=response.as(UserProfileResponse.class);
		Assert.assertEquals(userProfileResponse.getUsername(), "kshipra");
		
		UserProfileRequest userProfileRequest=new UserProfileRequest.Builder()
				.firstName("Disha")
				//.email("Disha24@yahoomai.com")
				.email("kships26@gmail.com")
				.lastName("Pahuja")					// Update in Last name
				.mobileNumber("9856565654")
			.build();	
		
		response=userProfileManagementService.updateProfile(loginResponse.getToken(), userProfileRequest);
		System.out.println(response.asPrettyString());
	}
}
/*----------------------OUTPUT-----------------
 * {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrc2hpcHJhIiwiaWF0IjoxNzYxNzM0Mjk1LCJleHAiOjE3NjE3Mzc4OTV9.Ao2iQuESCyf2r_rZACSmPM73T6UeLVdCuApoGn6XarQ",
    "type": "Bearer",
    "id": 3096,
    "username": "kshipra",
    "email": "kships26@gmail.com",
    "roles": [
        "ROLE_USER"
    ]
}
{
    "id": 3096,
    "username": "kshipra",
    "email": "kships26@gmail.com",
    "firstName": "Kshipra",
    "lastName": "Bhutani",
    "mobileNumber": "7838768048"
}
{
    "id": 3096,
    "username": "kshipra",
    "email": "Disha24@yahoomai.com",
    "firstName": "Disha",
    "lastName": "Pahuja",
    "mobileNumber": "9856565654"
}
PASSED: updateProfile
 */
