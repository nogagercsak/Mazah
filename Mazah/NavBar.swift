//
//  NavBar.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI

struct NavBar: View {
    
    @Binding var showSignInView: Bool

    var body: some View {
        HStack(spacing: 20) {
            
      //      NavigationLink(destination: HomeView(showSignInView: $showSignInView)
      //                      .navigationBarBackButtonHidden(true)) {
      //          Image(systemName: "house")
      //                  .font(.title)
      //      }
     //       .padding(.leading, 20)
                        
                        Spacer()
            
            
            NavigationLink(destination: ProfileView(showSignInView: $showSignInView)
                            .navigationBarBackButtonHidden(true)) {
                Image(systemName: "person.crop.circle")
                    .font(.title)
            }
            .padding(.leading, 20)
            
            Spacer()
            
    //        NavigationLink(destination: TrackerHomeView(showSignInView: $showSignInView)
   //                         .navigationBarBackButtonHidden(true)) {
  //              Image(systemName: "list.bullet")
  //                  .font(.title)
  //          }
            
            Spacer()
            
            NavigationLink(destination: SettingsView(showSignInView: $showSignInView)
                            .navigationBarBackButtonHidden(true)) {
                Image(systemName: "gearshape")
                    .font(.title)
            }
            .padding(.trailing, 20)
        }
        .foregroundColor(.primary)
        .padding(.top, 20)
        .frame(height: 60)
        .background(Color.white)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 5)
    }
}


struct NavBar_Previews: PreviewProvider {
    static var previews: some View {
        NavBar(showSignInView: .constant(true))
    }
}
