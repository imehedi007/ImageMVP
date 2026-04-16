import { ExperienceContent, RideFormData, RidePromptBundle } from "@/types";

export function buildRidePromptBundle(data: RideFormData, content: ExperienceContent): RidePromptBundle {
  const environment = content.environments.find((item) => item.id === data.environment);
  const mapped = content.behaviorQuestion.options.find((item) => item.id === data.behavior);
  const companionMode = content.settings.companionMode;
  const fallbackBehavior = content.behaviorQuestion.options[0];

  const selectedBehavior = mapped || fallbackBehavior;
  const personalityTraits = [data.vibe || "adventurous", ...selectedBehavior.traits];
  const sceneDirection = environment?.sceneDirection || "cinematic open-road atmosphere";
  const socialDynamic =
    companionMode === "solo"
      ? selectedBehavior.socialDynamicSolo
      : selectedBehavior.socialDynamicFriend;
  const subjectDirection =
    companionMode === "solo"
      ? `${data.name || "a stylish"} solo rider`
      : `${data.name || "a stylish"} rider with a close friend`;
  const compositionDirection =
    companionMode === "solo"
      ? "single subject only, no extra passenger, one rider on the bike"
      : "two friends together on the bike";
  const helmetDirection = content.settings.helmetRequired
    ? "The rider is wearing a premium full-face motorcycle helmet."
    : "The rider is not wearing a helmet. The face must be clearly visible and unobstructed.";
  const poseDirection = content.settings.poseDirection || "Stylish premium rider pose.";
  const cameraFrame = content.settings.cameraFrame || "Vertical premium portrait framing.";
  const wardrobeDirection =
    content.settings.wardrobeDirection ||
    "The rider is wearing fitted jeans, a real leather jacket, and premium biker streetwear.";
  const realismDirection =
    content.settings.realismDirection ||
    "Ultra photorealistic motorcycle campaign image with real materials and no cartoon styling.";
  const randomizedPose =
    content.settings.poseVariants.length > 0
      ? content.settings.poseVariants[Math.floor(Math.random() * content.settings.poseVariants.length)]
      : "";

  return {
    personalityTraits,
    emotionalTone: selectedBehavior.emotionalTone,
    socialDynamic,
    sceneDirection,
    imagePrompt:
      `Create a photorealistic cinematic lifestyle image of ${subjectDirection}. ` +
      `The generated person must preserve the exact identity of the uploaded individual with very high fidelity and remain clearly recognizable as the same real person. ` +
      `Identity priority is higher than styling. If there is any conflict between style and identity, preserve identity first. ` +
      `Match the same face shape, jawline, forehead, eyebrows, eyes, nose, lips, ears, skin tone, hairline, hairstyle, facial proportions, and age appearance. ` +
      `Preserve ethnicity, gender presentation, and the person's natural facial character. ` +
      `Do not alter, beautify, stylize, idealize, redesign, or generalize the person's identity. ` +
      `Render the face with realistic human detail: natural skin texture, visible pores, subtle fine lines, realistic under-eye detail, natural lip texture, and believable facial asymmetry. ` +
      `The face must look like a real DSLR or premium smartphone photo of a real person, not a synthetic or stylized rendering. ` +
      `Avoid waxy skin, plastic skin, over-smoothed skin, beauty-filter skin, airbrushed skin, CGI skin, or game-rendered skin. ` +
      `Scene: a real ${data.bikeType} Yamaha motorcycle in a believable ${data.environment} setting with ${sceneDirection}. ` +
      `${socialDynamic}. ${wardrobeDirection} ` +
      `Color accents use tones of ${data.favoriteColor}. ` +
      `Mood feels ${selectedBehavior.emotionalTone}. ${compositionDirection}. ` +
      `Pose and framing: ${poseDirection} ${randomizedPose} ${cameraFrame}. ` +
      `Show the full body from head to toe with visible ground below both feet and comfortable space above the head. ` +
      `Do not crop the top of the head. Do not crop the feet. ` +
      `Avoid tight crop, waist-up crop, knee crop, ankle crop, or any framing that makes the face too small to recognize clearly. ` +
      `Keep the face unobstructed, sharp, naturally lit, and clearly recognizable. ` +
      `Eyes should remain visible and facial features should be readable. ` +
      `${helmetDirection} ` +
      `Use soft natural lighting, realistic shadows, authentic reflections, natural perspective, and cinematic depth. ` +
      `The image should feel like real premium lifestyle photography captured in one moment at one location. ` +
      `The background must be a believable real-world environment with natural texture variation, realistic spatial depth, and lighting continuity with the subject and motorcycle. ` +
      `The subject, motorcycle, and background must feel captured in one real photograph at the same location and time. ` +
      `Avoid artificial studio-looking compositing, fake CGI backgrounds, unrealistic environmental separation, or overly clean backdrops. ` +
      `${realismDirection} ` +
      `Avoid identity drift, lookalike faces, generic model face, hidden eyes, sunglasses, face covering, anime style, cartoon style, illustration style, fake compositing, and synthetic-looking facial detail. ` +
      `Final result should be photorealistic, authentic, emotionally engaging, and premium, while remaining grounded in real human facial detail and believable environmental realism.`,
    storyPrompt:
      `Create a concise JSON object with keys "summary" and "caption". The rider is ${data.name || "the user"}, ` +
      `with traits ${personalityTraits.join(", ")}. The emotional tone is ${selectedBehavior.emotionalTone}. ` +
      `The social dynamic is ${socialDynamic}. The scene is a ${data.environment} ride on a ${data.bikeType}. ` +
      `Favorite color: ${data.favoriteColor}. Keep the summary under 45 words and the caption under 18 words.`,
    summarySeed:
      `${data.name || "You"} ride like someone ${personalityTraits.join(", ")}, turning every ${data.environment} route into a shared memory.`,
    captionSeed: "Just found my ride personality. #RideStory #MyBikeMood"
  };
}

export function fallbackStoryText(data: RideFormData, bundle: RidePromptBundle) {
  return {
    summary:
      `${data.name || "You"} come across as ${bundle.personalityTraits.slice(0, 3).join(", ")}, with a ${bundle.emotionalTone} presence that makes every ${data.environment} ride feel cinematic and personal.`,
    caption: "Just found my ride personality. #RideStory #MyBikeMood"
  };
}
