import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateDietPlanPDF } from "@/lib/pdfGenerator";

interface MealData {
  earlyMorning: string;
  preWorkout: string;
  postWorkout: string;
  breakfast: string;
  midMorning: string;
  lunch: string;
  eveningSnack: string;
  dinner: string;
  bedtime: string;
}

export const DietPlanForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "",
    gender: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    dietType: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    startDate: "",
    trainerName: "G-FORCE",
    waterIntake: "",
    supplements: "",
    notes: "",
  });

  const [meals, setMeals] = useState<MealData>({
    earlyMorning: "",
    preWorkout: "",
    postWorkout: "",
    breakfast: "",
    midMorning: "",
    lunch: "",
    eveningSnack: "",
    dinner: "",
    bedtime: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMealChange = (field: keyof MealData, value: string) => {
    setMeals(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    // Basic validation
    if (!formData.clientName || !formData.age || !formData.weight) {
      toast.error("Please fill in required fields (Name, Age, Weight)");
      return;
    }

    setIsGenerating(true);
    try {
      await generateDietPlanPDF(formData, meals);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Client Information */}
      <Card className="p-6 border-primary/20 bg-card glow-neon">
        <h2 className="text-2xl font-bold mb-6 text-primary text-glow">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-foreground">Client Name *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleInputChange("clientName", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-foreground">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-foreground">Age *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="text-foreground">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-foreground">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange("height", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-foreground">Goal</Label>
            <Select value={formData.goal} onValueChange={(value) => handleInputChange("goal", value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fat Loss">Fat Loss</SelectItem>
                <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietType" className="text-foreground">Diet Type</Label>
            <Select value={formData.dietType} onValueChange={(value) => handleInputChange("dietType", value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select diet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Veg">Vegetarian</SelectItem>
                <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                <SelectItem value="Veg + Egg">Veg + Egg</SelectItem>
                <SelectItem value="Vegan">Vegan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-foreground">Plan Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainerName" className="text-foreground">Trainer Name</Label>
            <Input
              id="trainerName"
              value={formData.trainerName}
              onChange={(e) => handleInputChange("trainerName", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Macros & Nutrition */}
      <Card className="p-6 border-primary/20 bg-card glow-neon">
        <h2 className="text-2xl font-bold mb-6 text-primary text-glow">Macros & Nutrition</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories" className="text-foreground">Calories (kcal/day)</Label>
            <Input
              id="calories"
              type="number"
              value={formData.calories}
              onChange={(e) => handleInputChange("calories", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="protein" className="text-foreground">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              value={formData.protein}
              onChange={(e) => handleInputChange("protein", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carbs" className="text-foreground">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={formData.carbs}
              onChange={(e) => handleInputChange("carbs", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fat" className="text-foreground">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              value={formData.fat}
              onChange={(e) => handleInputChange("fat", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterIntake" className="text-foreground">Water Intake (L/day)</Label>
            <Input
              id="waterIntake"
              type="number"
              step="0.5"
              value={formData.waterIntake}
              onChange={(e) => handleInputChange("waterIntake", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="supplements" className="text-foreground">Supplements</Label>
            <Input
              id="supplements"
              placeholder="e.g., Multivitamin, Whey, Omega-3"
              value={formData.supplements}
              onChange={(e) => handleInputChange("supplements", e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Meal Plan */}
      <Card className="p-6 border-primary/20 bg-card glow-neon">
        <h2 className="text-2xl font-bold mb-6 text-primary text-glow">Daily Meal Plan</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="earlyMorning" className="text-foreground font-semibold">Early Morning / On Waking</Label>
            <Textarea
              id="earlyMorning"
              placeholder="e.g., Lukewarm water + lemon + honey"
              value={meals.earlyMorning}
              onChange={(e) => handleMealChange("earlyMorning", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preWorkout" className="text-foreground font-semibold">Pre-Workout</Label>
            <Textarea
              id="preWorkout"
              placeholder="e.g., Any citrus fruit + roasted seeds"
              value={meals.preWorkout}
              onChange={(e) => handleMealChange("preWorkout", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postWorkout" className="text-foreground font-semibold">Post-Workout</Label>
            <Textarea
              id="postWorkout"
              placeholder="e.g., Protein shake"
              value={meals.postWorkout}
              onChange={(e) => handleMealChange("postWorkout", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakfast" className="text-foreground font-semibold">Breakfast</Label>
            <Textarea
              id="breakfast"
              placeholder="e.g., 6 egg whites + oats 50g + walnuts 25g"
              value={meals.breakfast}
              onChange={(e) => handleMealChange("breakfast", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="midMorning" className="text-foreground font-semibold">Mid-Morning Snack</Label>
            <Textarea
              id="midMorning"
              placeholder="e.g., Greek yogurt + berries"
              value={meals.midMorning}
              onChange={(e) => handleMealChange("midMorning", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunch" className="text-foreground font-semibold">Lunch</Label>
            <Textarea
              id="lunch"
              placeholder="e.g., Grilled chicken 150g + brown rice 100g + vegetables"
              value={meals.lunch}
              onChange={(e) => handleMealChange("lunch", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eveningSnack" className="text-foreground font-semibold">Evening Snack</Label>
            <Textarea
              id="eveningSnack"
              placeholder="e.g., Handful of nuts + green tea"
              value={meals.eveningSnack}
              onChange={(e) => handleMealChange("eveningSnack", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dinner" className="text-foreground font-semibold">Dinner</Label>
            <Textarea
              id="dinner"
              placeholder="e.g., Grilled fish 150g + quinoa 80g + steamed vegetables"
              value={meals.dinner}
              onChange={(e) => handleMealChange("dinner", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedtime" className="text-foreground font-semibold">Bedtime Drink</Label>
            <Textarea
              id="bedtime"
              placeholder="e.g., Casein protein shake or warm milk"
              value={meals.bedtime}
              onChange={(e) => handleMealChange("bedtime", e.target.value)}
              className="bg-secondary border-border focus:border-primary min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      {/* Additional Notes */}
      <Card className="p-6 border-primary/20 bg-card glow-neon">
        <h2 className="text-2xl font-bold mb-6 text-primary text-glow">Additional Tips & Notes</h2>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground">Notes for Client</Label>
          <Textarea
            id="notes"
            placeholder="Add any special instructions, tips, or guidelines..."
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            className="bg-secondary border-border focus:border-primary min-h-[120px]"
          />
        </div>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-neon-strong font-bold text-lg px-12 py-6"
        >
          {isGenerating ? "Generating PDF..." : "Generate Diet Plan PDF"}
        </Button>
      </div>
    </div>
  );
};
