//
//  ViewController.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//


import SwiftUI
import ScanditBarcodeCapture

// Define the ViewController
class ViewController: UIViewController {
    private var context: DataCaptureContext!
    private var barcodeCapture: BarcodeCapture!

    override func viewDidLoad() {
        super.viewDidLoad()
        print("View did load.")
        context = DataCaptureContext(licenseKey: "Ao70tg70KrKYAbjaqROnJRI8kljrO4vVUxjD1aY6llnSa88L71UMEblAaCpXVSnFVGJhnXodjK1pEJIv+FKHRVhLlUsGa6CJ5FCL9DgaOtNBQ0HIrkT+ngA3YlqqWPnekVkDhON3CwntZy/58lQFTmVM/FmiV4V4JmrmTHdC4tg8RXNdFXsHzWNJhZOiZ9PY/0mMJj9yWv7ZfzAXMH7pQ8Nr6YL3VP6pOX9YLC5tvVEkVB0cuVrrBoVTr+0sSWUhMG26ezlD0kZwX/Kj1VmtQyh/I9BnWsBrQk1d9KJLCqwEbf7D6GB2ZppCaaplVYyL8HzLY8lrhpvya+OhP2f5JRcCR6rwdXqgPh4BgWcbIaWlFry1the2GXFr03Z8UGIFNDib0k9Jq4TrewDB3Ve8a4xdAFT+ZOGs1zaatuIIeksAVyUenF84inhl3ZDgIEZpwU3WL1hqcldocN8noSHMMrAl5goWbrEXunTYawYZUAC1ZdCzAVD53JhxYiZBXBwguXIAwdJbfnQfD01tf0puRexUwiTQTQWn7VeXXRtBlSR9c5gRyxN/yElznWHfdtpmzjuxjb5AeG8gE9keeE8dtyItuvj0BVdoYV2z2oZiqRApFZ1R7iqCN8ZS0J9+d/37EG/mK0N8d2xwS8sF3D94coB5gyzYVbWt93ZWoM1zTL8WBS77rgi23ftd97TYa3h8SygXGypREaaecGe8NHiX6WMv5ZX9beBXKVAmJ3h/DLiXTqOFDhVujchbJ0QodatEBl7gMGNG+IbJdAmqM09/1CEPY8NOTK/kgUQK6toF/1tWdmQBfH9uOcZmoIwuc6O8ShH5jJwNBJSlAm1u7lWLX5F+afP/V3w2xw49uhsxLZ8cabANjWvx4QVfc5NlHUgChnkXrAczJSifUu5FgXLXHAJKHGa+S4ZXmWbVIhgzzjVfVzAZN2YGqQBEP0gvOvrxhnWB+Mxp/fLlfmzOLWQ5L7lVoD9YYAuz2WReRco5+qT29RdxDbXc46LGNt6KFNbaAvEjiMpxuxpHhVAeamjpCv1qSBvUED5vddgq1MjhFAyFuYX1z3DCJ+BJPhEBVp18/FHqIt2pzYFr63piI9piGNEGY6UgMF1yuisKudVKcZjlc9TPbvK3gwxgx6kpwIgp3+kAQ3wef+qklNMFVI8EcicbEtK+FpVdoOcoE0kxpgApkyB8W5Begg89oKadHGUA3T2vJsL9G4sZupg0BBx5KC8ZzQxui3CjUUVUk3cV5wwhklKg2ONc3/rU4NpQCLWRdjztsyQ2dF6vpWqzPrOkR7Tb/1x//evvC9pEOV8BaWfGOGPMcugfDAls2hEJ6aeKpkpKYMfaSVsYCvfdYpgcQJuQWBdK4yUIhaXnUf8z66tG6oSqMpUPvRRODuc9XEptZdWL95It79/xh5RVbtliEOMdyxLS6yONhlJdFPs70y4h6g5BlazKSwFcDPR0AYzDrmjQAkobyK7H+lGGf5kf5HMvJ0VYsWlBx3OUEUOxMNu6unkXHTChBEEbOFWP6Xz8uMVlGga8R2R4YFb0aVe57M8lzlx2UAnnvWQZfO60cK446XqbuF1STkjO0aZobltVdH3ujWMk774ZxrrKuk+nzskHJ4PaAQNsZwned59bqdsNcIbBmSDEaBNQogCZ4CW7DdaYVHyKsFAj5wQ4+4KlFA==")
        setupBarcodeCapture()
        setupCamera()
        setupCaptureView()
    }

    private func setupBarcodeCapture() {
        print("Setting up barcode capture.")
        let settings = BarcodeCaptureSettings()
        settings.set(symbology: .code128, enabled: true)
        settings.set(symbology: .code39, enabled: true)
        settings.set(symbology: .qr, enabled: true)
        settings.set(symbology: .ean8, enabled: true)
        settings.set(symbology: .upce, enabled: true)
        settings.set(symbology: .ean13UPCA, enabled: true)
        // Optionally set duplicate filter
        settings.codeDuplicateFilter = 500 // or -1 to disable duplicates entirely

        barcodeCapture = BarcodeCapture(context: context, settings: settings)
        barcodeCapture.addListener(self)
    }

    private func setupCamera() {
        print("Setting up camera.")
        let cameraSettings = BarcodeCapture.recommendedCameraSettings
        let camera = Camera.default
        camera?.apply(cameraSettings)

        context.setFrameSource(camera)
        camera?.switch(toDesiredState: .on)
    }


    private func setupCaptureView() {
        print("Setting up capture view.")
        let captureView = DataCaptureView(context: context, frame: view.bounds)
        captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(captureView)

        let overlay = BarcodeCaptureOverlay(barcodeCapture: barcodeCapture, view: captureView)
    }
}

extension ViewController: BarcodeCaptureListener {
    func barcodeCapture(_ barcodeCapture: BarcodeCapture,
                        didScanIn session: BarcodeCaptureSession,
                        frameData: FrameData) {
        let recognizedBarcodes = session.newlyRecognizedBarcodes
        for barcode in recognizedBarcodes {
            let barcodeData = barcode.data ?? "No Data"
            print("Barcode Data: \(barcodeData)")
            fetchFoodData(for: barcodeData)
        }
        barcodeCapture.isEnabled = false
    }

    private func fetchFoodData(for barcode: String) {
        let urlString = "https://world.openfoodfacts.net/api/v2/product/\(barcode)?fields=product_name,nutrition_grades,nutriments,image_url"
        guard let url = URL(string: urlString) else {
            print("Invalid URL")
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                print("Error fetching data: \(error)")
                return
            }

            guard let data = data else {
                print("No data returned")
                return
            }

            do {
                let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
                if let product = json?["product"] as? [String: Any] {
                    let name = product["product_name"] as? String ?? "No Name"
                    let nutritionGrades = product["nutrition_grades"] as? String ?? "No Nutri-Score"
                    let imageUrl = product["image_url"] as? String ?? "No Image"
                    let nutriments = product["nutriments"] as? [String: Any] ?? [:]
                    let scanDate = Date()

                    DispatchQueue.main.async {
                        self.showFoodInfo(name: name, nutritionGrades: nutritionGrades, imageUrl: imageUrl, nutriments: nutriments, scanDate: scanDate)
                    }
                } else {
                    print("No product found for barcode")
                }
            } catch {
                print("Error parsing JSON: \(error)")
            }
        }

        task.resume()
    }

    private func showFoodInfo(name: String, nutritionGrades: String, imageUrl: String, nutriments: [String: Any], scanDate: Date) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        dateFormatter.timeStyle = .none

        let scanDateString = dateFormatter.string(from: scanDate)

        let alert = UIAlertController(title: name, message: "Nutri-Score: \(nutritionGrades)\nScan Date: \(scanDateString)", preferredStyle: .alert)
        if let url = URL(string: imageUrl), let data = try? Data(contentsOf: url), let image = UIImage(data: data) {
            let imageView = UIImageView(image: image)
            imageView.contentMode = .scaleAspectFit
            imageView.frame = CGRect(x: 10, y: 70, width: 250, height: 150)
            alert.view.addSubview(imageView)
            alert.view.heightAnchor.constraint(equalToConstant: 300).isActive = true
        }
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        self.present(alert, animated: true, completion: nil)
    }
}

struct BarcodeCaptureViewControllerRepresentable: UIViewControllerRepresentable {
    typealias UIViewControllerType = ViewController

    func makeUIViewController(context: Context) -> ViewController {
        return ViewController()
    }

    func updateUIViewController(_ uiViewController: ViewController, context: Context) {
        // No need to update anything for now
    }
}

