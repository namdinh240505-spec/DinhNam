import { useState } from "react";

export default function BookTripForm() {
  const [tripId, setTripId] = useState("");
  const [seat, setSeat] = useState("");
  const [result, setResult] = useState(null);

  // Token đã tạo bằng Tinker
  const token = "3|qPpu1z49BuEnWADpEi5clASx0vZRBtO5C4VPxmFI9ecaceee";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/api/book-trip", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tripId: parseInt(tripId), seat }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ success: false, message: "Lỗi khi gọi API" });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Đặt Vé Xe</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Trip ID:</label>
          <input
            type="number"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Seat:</label>
          <input
            type="text"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>Đặt Vé</button>
      </form>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <strong>Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
